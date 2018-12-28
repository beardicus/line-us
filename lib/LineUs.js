const WebSocket = require('isomorphic-ws')
const pQueue = require('p-queue')
const pEvent = require('p-event')
const Nanobus = require('nanobus')
const lowercaseKeys = require('lowercase-keys')

const serialize = require('./serialize.js')
const deserialize = require('./deserialize.js')
const { translate, untranslate } = require('./translate.js')

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

    this.info = {}

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
      this.emit('error', 'LineUs: websocket error: ' + e)
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

  pause() {
    this._queue.pause()
    this.state = 'paused'
  }

  resume() {
    this.start()
  }

  stop() {
    this.pause()
    this.clear()
  }

  clear() {
    this._queue.clear()
  }

  async send(cmd) {
    const { g, params } = cmd

    if (params && 'z' in params) {
      // monitor the z height of commands to keep track of pen up/down state
      if (params.z < 500) {
        this._queuedPenState = 'down'
      } else {
        this._queuedPenState = 'up'
      }
    }

    if (g.toUpperCase() === 'G28') {
      // special case penUp for 'home' command
      this._queuedPenState = 'up'
    }

    // queue up calls to _send because line-us has no buffer
    return this._queue.add(() => this._send(cmd))
  }

  async _send(cmd) {
    try {
      const responseEvent = pEvent(this._ws, 'message')
      this._ws.send(serialize(cmd))

      let response = await responseEvent
      response = deserialize(response.data || response)

      if (response.type === 'ok' && 'X' in response.data) {
        response.data = untranslate(lowercaseKeys(response.data))
        // update and emit current coordinates
        this.coordinates = response.data
      }

      return response
    } catch (e) {
      this.emit('error', 'LineUs: error sending command: ' + e)
    }
  }

  async penUp() {
    return this.to({ z: 1000 })
  }

  async penDown() {
    return this.to({ z: 0 })
  }

  async to(xyz) {
    return this.send({
      g: 'G01',
      params: translate(xyz),
    })
  }

  async moveTo(xy) {
    // to lift the pen, just inject Z1000 into the move
    if (this._queuedPenState === 'down') xy.z = 1000
    return this.to(xy)
  }

  async lineTo(xy) {
    // to lower the pen, send a separate Z0 command first
    // combining w/ the xy move does not work because for a move with {z: 0}
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
}

module.exports = LineUs
