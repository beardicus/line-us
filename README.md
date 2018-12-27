# @beardicus/line-us

A JavaScript library for controlling the [Line-us](https://line-us.com) drawing robot via its websocket interface. Works in both Node.js and the browser. Work in progress.

## Example

```js
const LineUs = require('@beardicus/line-us')
const bot = new LineUs()

bot.on('connected', async () => {
  const commands = [
    // draw an 'X' and go home
    bot.moveTo({ x: 1000, y: 200 }),
    bot.lineTo({ x: 1400, y: -200 }),
    bot.moveTo({ x: 1400, y: 200 }),
    bot.lineTo({ x: 1000, y: -200 }),
    bot.home(),
  ]
  await Promise.all(commands)
  console.log('done!')
})
```

## Installation

Install via npm:

```shell
$ npm install @beardicus/line-us
```

A prebuilt browser version is also available via the [unpkg](https://unpkg.com/) CDN:

```html
<script type="text/javascript" src="https://unpkg.com/@beardicus/line-us/dist/line-us.min.js"></script>
```

## Usage Basics

### `LineUs = require('@beardicus/line-us')`

Import the LineUs class. If you're using the prebuilt browser version in a `<script>` tag you should skip this.

### `bot = new LineUs({opts})`

Create a `LineUs` instance. Optionally pass in an object with any of the following options:

```js
{
  url: 'ws://line-us.local',
  autoConnect: true,
  autoStart: true
}
```

All arguments are optional. The default values are shown above.

#### Options

- `url`: (optional) the websocket address to connect to.
- `autoConnect`: (optional) when `true` LineUs will automatically connect to the websocket upon creation.
- `autoStart`: (optional) when `true` the queue will be started automatically upon connection.

### `.connect()`

Connects to the machine's websocket. This is called automatically unless specified `autoConnect: false` when creating your instance.

### `.disconnect()`

Closes the websocket connection and stops the queue.

### `.send({cmd})`

Send a command to the machine. You probably don't want to use this, and should instead use the commands listed in the [Movement Commands](#movement-commands) section to interact with the machine.

#### Parameters

Accepts a single object that will be serialized into G-code. For example:

```js
{
  g: 'G01',
  params: {
    x: 1000
    y: 900
  }
}
```

- `g`: (required) the G-code.
- `params`: (optional) an object with parameters that will follow the `g` code.

All G-codes and parameter keys are forced to uppercase (though I don't think the Line-us machine cares). Parameter values are not enclosed in quotes but probably should be (TODO). The example above will be serialized into:

```
G01 X1000 Y900
```

Parameter order is not guaranteed.

#### Returns

All commands that are sent to the machine return a promise. When the machine sends a response the promise will resolve into an object representing the parsed response:

```js
{
  type: 'ok',
  data: {
    X: '1000',
    Y: '1000',
    Z: '1000'
  }
}
```

## Movement Commands

### `.penUp()`

Lifts the pen up.

### `.penDown()`

Sets the pen down.

### `.moveTo({xy})`

Moves the arm to the coordinates specified, lifting the pen first if necessary.

#### Parameters

Accepts a single object specifying the X and Y coordinates to move to:

```js
{
  x: 1000
  y: 1000
}
```

You may specify one axis or both. Capitalization of the object keys does not matter.

### `.lineTo({xy})`

Draws a line to the coordinates specified, setting the pen down first if necessary.

#### Parameters

Accepts a single object specifying the X and Y coordinates to draw a line to:

```js
{
  x: 1000
  y: 1000
}
```

You may specify one axis or both. Capitalization of the object keys does not matter.

### `.home()`

Lifts the pen up and moves to the home position at machine coordinates `{ x: 1000, y: 1000}`.

## Queue Control

The Line-us machine has no buffer, and will only acknowledge one command at a time. `line-us` uses a queue to buffer commands and ensure that only one is sent at a time.

Before starting the queue you could pre-fill it with all the commands for a drawing, or you may want to start it right away and use it just as a buffer while you send commands in "real-time". You can pause, resume, and clear the queue as well.

### `.start()`

Starts the queue. Any messages in the queue will start sending to the machine. If the queue is empty it will wait for commands.

### `.pause()`

Temporarily pause the queue. The current message will finish sending and the machine will finish executing the move, so there can be a delay between pausing and the machine ceasing movement.

### `.resume()`

Unpause the queue and start sending messages where it left off.

### `.stop()`

Stop the queue and clear it.

### `.clear()`

Clear all commands out of the queue. The queue remains in its current state with regards to being `paused` or `drawing`.

## Events

### `.on('state', (string) => {})`

The `state` event fires whenever there is a state change. It passes along the new state as one of the following strings:

- `disconnected`: the websocket is not connected, either because we're just starting up or because the connection was lost or closed.
- `connecting`: a websocket connection is being established
- `connected`: the websocket is connected to the Line-us machine and has recieved its initial `hello` message.
- `paused`: the queue is paused and no messages will be sent to the machine.
- `drawing`: the queue is started and messages are being sent to the machine.

> **Note:** all the states emitted under the `state` event are also emitted under their own name. So if you want to listen only for the `connected` event, for example, you may do `.on('connected', () => {})`.

### `.on('error', (string) => {})`

Emits errors from the websocket or Line-us machine.

### `.on('coordinates', (obj) => {})`

Emits a coordinate object every time the Line-us machine replies with its current coordinates. The object will be in the following form:

```js
{
  x: 1000,
  y: 1000,
  z: 1000
}
```

It will always have all three coordinates, even if the command that triggered the event used only one or two. The coordinate emitted will by the machine's position _when it finishes the current command_. It is not the machine's immediate position.

## Roadmap

- Optionally translate from machine coordinates to a more standard system.
- Competent error handling.
- Competent input checking.
- Actual tests.
- Simple progress info using a naive queue size / total.
- Smarter progress info with percentage and time estimates based on "speed" setting and analyzing actual paths.
- `preview` method that will translate the queue into a canvas drawing or SVG `polyline`s.
