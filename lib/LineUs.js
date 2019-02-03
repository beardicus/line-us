const WebSocket = require('isomorphic-ws')
const pQueue = require('p-queue')
const pEvent = require('p-event')
const Nanobus = require('nanobus')
const lowercaseKeys = require('lowercase-keys')

const { serialize, deserialize } = require('./serialize.js')
const { translate, untranslate } = require('./translate.js')
const validate = require('./validate.js')

class LineUs extends Nanobus {
  constructor(opts) {
    opts = Object.assign(
      {
        url: 'ws://line-us.local',
        autoConnect: true,
        autoStart: true,
      },
      opts
    )
    super('line-us')

    this.url = opts.url
    this.autoConnect = opts.autoConnect
    this.autoStart = opts.autoStart

    this.info = {} // populated by `hello` message from Line-us

    this._ws = null
    this._queue = new pQueue({ concurrency: 1, autoStart: false })

    this._state = 'disconnected'
    this._coordinates = {}
    this._queuedPenState = 'up'

    if (this.autoConnect) {
      this.connect()
    }
  }

  get state() {
    return this._state
  }
  set state(state) {
    this._state = state
    this.emit('state', state)
    this.emit(state)
  }

  get coordinates() {
    return this._coordinates
  }
  set coordinates(xyz) {
    this._coordinates = xyz
    this.emit('coordinates', xyz)
  }

  connect() {
    this.state = 'connecting'
    this._ws = new WebSocket(this.url)

    this._ws.onopen = async () => {
      let response = await pEvent(this._ws, 'message') // wait for hello
      response = deserialize(response.data || response)

      this.info = lowercaseKeys(response.data)
      this.state = 'connected'
      this._queuedPenState = 'up' // should be at home position right now
      this.coordinates = { x: 350, y: 0, z: 1000 }

      if (this.autoStart) {
        this.start()
      } else {
        this.pause() // we're already paused, but this will emit the event
      }
    }

    this._ws.onclose = () => {
      this.state = 'disconnected'
      this.stop()
    }

    this._ws.onerror = (e) => {
      this.emit('error', 'LineUs: websocket error: ' + e.error.message)
    }
  }

  disconnect() {
    // it's possible this.stop() should go here instead of waiting for `onclose`
    this._ws.close()
  }

  start() {
    this._queue.start()
    this.state = 'drawing'
  }

  async pause({ lift = true } = {}) {
    if (this.state === 'paused') return Promise.resolve() // resolve immediately
    validate.lift(lift)

    // we add the pause command at the head of the queue w/ `priority: 1`
    // this allows the currently executing command to flush, and lets us
    // test the current z height to determine if we should send a `penUp()`
    // and queue the corresponding `penDown()` for execution when we `resume()`
    return this._queue.add(
      () => {
        const z = this.coordinates.z

        this._queue.pause()
        this.state = 'paused'

        if (z < 500 && lift) {
          this._queue.add(
            () => {
              return this._send({ g: 'G01', params: { z } })
            },
            { priority: 1 }
          )
          return this._send({ g: 'G01', params: { z: 1000 } })
        }
      },
      { priority: 1 }
    )
  }

  resume() {
    this.start()
  }

  async stop() {
    await this.pause()
    this.clear()
  }

  clear() {
    this._queue.clear()
  }

  async send(cmd) {
    validate.cmd(cmd)
    const { g, params } = cmd

    if (params && 'z' in params) {
      // monitor z to keep track of the pen up/down state of queued commands
      if (params.z < 500) {
        this._queuedPenState = 'down'
      } else {
        this._queuedPenState = 'up'
      }
    }

    if (g.toUpperCase() === 'G28') {
      // special case pen up state for 'home' command
      this._queuedPenState = 'up'
    }

    // queue up calls to _send because Line-us has no buffer
    return this._queue.add(() => this._send(cmd))
  }

  async _send(cmd) {
    const responseEvent = pEvent(this._ws, 'message')
    this._ws.send(serialize(cmd))

    let response = await responseEvent
    response = deserialize(response.data || response)

    switch (response.type) {
      case 'ok':
        let data = response.data
        if ('X' in data) {
          data = untranslate(lowercaseKeys(data)) // translate back from machine coordinates
          this.coordinates = data // update and emit current coordinates
        }
        return data

      case 'error':
        throw new Error('LineUs: ' + response.data.INFO)

      default:
        throw new Error('LineUs: unknown response type')
    }
  }

  async penUp() {
    return this.to({ z: 1000 })
  }

  async penDown() {
    return this.to({ z: 0 })
  }

  async to(xyz) {
    validate.xyz(xyz)
    return this.send({
      g: 'G01',
      params: translate(xyz),
    })
  }

  async moveTo(xy) {
    validate.xy(xy)
    // to lift the pen, we inject Z1000 into the move
    if (this._queuedPenState === 'down') xy.z = 1000
    return this.to(xy)
  }

  async lineTo(xy) {
    validate.xy(xy)
    // to lower the pen, send a separate Z0 command first
    // combining z w/ the xy move does not work because for a move with {z: 0}
    // Line-us won't drop the pen until the end of the movement
    if (this._queuedPenState === 'up') this.penDown() // TODO: don't ignore this response?
    return this.to(xy)
  }

  async home() {
    return this.send({ g: 'G28' })
  }

  async getPosition() {
    return this.send({ g: 'M114' })
  }

  async getCapabilities() {
    return this.send({ g: 'M115' })
  }

  async getDiagnostics() {
    return this.send({ g: 'M122' })
  }

  async setCalibration() {
    return this.send({ g: 'M374' })
  }

  async clearCalibration() {
    return this.send({
      g: 'M374',
      params: { s: 'clear' },
    })
  }

  async setMachineName(name) {
    validate.name(name)
    return this.send({
      g: 'M550',
      params: { p: `"${name}"` }, // add quotes for safety
    })
  }

  async getMachineName() {
    // TODO: extract MACHINENAME from response and return just the string?
    return this.send({ g: 'M550' })
  }

  async saveWifiNetwork(input) {
    validate.wifi(input)
    const { ssid, password } = input
    let params = { s: `"${ssid}"` }

    if (password !== undefined) params.p = `"${password}"`

    return this.send({
      g: 'M587',
      params: params,
    })
  }

  async listWifiNetworks() {
    return this.send({ g: 'M587' })
  }

  async forgetWifiNetwork(input) {
    validate.wifi(input)
    const { ssid } = input
    const params = { s: `"${ssid}"` }

    return this.send({
      g: 'M588',
      params: params,
    })
  }
}

module.exports = LineUs
