const WebSocket = require('isomorphic-ws')
const pQueue = require('p-queue')
const pEvent = require('p-event')
const Nanobus = require('nanobus')
const lowercaseKeys = require('lowercase-keys')

const serialize = require('./serialize.js')
const deserialize = require('./deserialize.js')

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
        // update and emit machine coordinates
        this.coordinates = lowercaseKeys(response.data)
      }

      return response
    } catch (e) {
      this.emit('error', 'LineUs: error sending command: ' + e)
    }
  }

  async penUp() {
    this._queuedPenState = 'up'
    return this.send({
      g: 'G01',
      params: { z: 1000 },
    })
  }

  async penDown() {
    this._queuedPenState = 'down'
    return this.send({
      g: 'G01',
      params: { z: 0 },
    })
  }

  async moveTo(xy) {
    if (this._queuedPenState === 'down') this.penUp()
    return this.send({
      g: 'G01',
      params: xy,
    })
  }

  async lineTo(xy) {
    if (this._queuedPenState === 'up') this.penDown()
    return this.send({
      g: 'G01',
      params: xy,
    })
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
