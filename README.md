# @beardicus/line-us

A JavaScript library for controlling the [Line-us](https://line-us.com) drawing robot via its websocket interface. Works in both Node.js and the browser.

## Example

```js
const LineUs = require('@beardicus/line-us')
const bot = new LineUs()

bot.on('connected', async () => {
  // draw an 'X'
  bot.moveTo({ x: 0, y: 0 })
  bot.lineTo({ x: 500, y: 500 })
  bot.moveTo({ x: 500, y: 0 })
  bot.lineTo({ x: 0, y: 500 })

  // wait for home
  await bot.home()
  console.log(`job's done!`)
})
```

## Contents

- [Installation](#installation)
- [Setup](#setup)
- [Communication](#communication)
- [Movement](#movement)
- [Configuration](#configuration)
- [Events](#events)
- [TODO](#todo)

## Installation

Install via npm:

```shell
$ npm install @beardicus/line-us
```

A prebuilt browser version is also available via the [unpkg](https://unpkg.com/) CDN:

```html
<script type="text/javascript" src="https://unpkg.com/@beardicus/line-us/dist/line-us.min.js"></script>
```

## Setup

The code in this section is used to set up and configure a new `LineUs` instance.

### `LineUs = require('@beardicus/line-us')`

Imports the `LineUs` class. If you're using the prebuilt browser version of the library (using a `<script>` tag) you should skip this, as there will already be a global `LineUs` class available.

### `bot = new LineUs({opts})`

Create a `LineUs` instance. Optionally, pass in an object to set options:

```js
{
  url: 'ws://line-us.local',
  autoConnect: true,
  autoStart: true,
  concurrency: 1
}
```

**Parameters:** all are optional. The default values are shown above.

- **`url`**: (optional) a string that contains the websocket address to connect to. **Default is `ws://line-us.local`** which is the default name and address of all Line-us machines
- **`autoConnect`**: (optional) a boolean, if true will automatically attempt to connect to the websocket. **Defaults to `true`**
- **`autoStart`**: (optional) a boolean, if true the queue will be started automatically upon connection to the websocket. **Defaults to `true`**. See [Queue Control](#queue-control) for more information on the command queue.
- **`concurrency`**: (optional) a number which controls the number of commands that are sent before waiting for a response. This setting can improve performance where the network between the sender and Line-us has high latency. Bear in mind though `pause()` will not be instant if `concurrency` is high.

## Communication

This library uses a websocket connection to communicate with your Line-us machine. The commands in this section control the websocket connection and allow you send messages to your machine.

### `.connect()`

Connects to the Line-us machine's websocket. This is done automatically unless `autoConnect` is set to `false` when creating the `LineUs` instance.

### `.disconnect()`

Closes the websocket connection and stops the queue.

### `.send({cmd})`

Sends a command to the machine, first buffering it in the queue if necessary.

You probably don't want to use this directly, and should instead use the commands listed in the [Movement](#movement) and [Configuration](#configuration) sections to interact with the machine.

**Parameters:** accepts a single object that will be serialized into G-code. For example:

```js
{
  g: 'G01',
  params: {
    x: 1000,
    y: 900
  }
}
```

- **`g`**: (required) the G-code command
- **`params`**: (optional) an object with any parameters the G-code requires

All G-codes and parameter keys (`x` and `y` in the example above) are forced to uppercase (though the Line-us machine doesn't seem to care). The example above would be serialized into:

```
G01 X1000 Y900
```

**Returns:** all commands sent to the Line-us websocket will return a promise that resolves when we receive a response. The value will be the machine's response parsed into an object such as the following:

```js
{
  x: '350',
  y: '500',
  z: '0'
}
```

The exact data returned depends on the command being responded to.

## Movement

The commands in this section all deal with moving the robot arm. They are all asynchronous and return a promise for the Line-us machine's eventual response. See [Movement Responses](#movement-responses) for more detailed information.

You should be able to draw a masterpiece using just the canvas-style `.moveTo()` and `.lineTo()` commands, but the trio of `.penUp()` `.penDown` and plain `.to()` movements are also available for any situations where they may be more ergonomic to use.

The coordinate system used is different from the Line-us machine's default "machine coordinates". If you look at the [Line-us drawing area diagram](https://github.com/Line-us/Line-us-Programming/blob/master/Documentation/LineUsDrawingArea.pdf), this library places the `{x: 0, y: 0}` origin in the upper left of the area labeled "App drawing area". Positive numbers move to the right and down just like in the browser and the canvas API. The machine's home position in this coordinate system is `{x: 350, y: 0}`. The `z` axis behavior remains the same.

### `.moveTo({xy})`

Moves the arm to the coordinates specified, lifting the pen first if necessary.

**Parameters:** an object with one or both of `x` and `y` coordinates specified:

```js
{
  x: 800,
  y: 900
}
```

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### `.lineTo({xy})`

Draws a line to the coordinates specified, setting the pen down first if necessary.

**Parameters:** an object with one or both of `x` and `y` coordinates specified:

```js
{
  x: 800,
  y: 900
}
```

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### `.penUp()`

Lifts the pen up.

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### `.penDown()`

Sets the pen down.

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### `.to({xyz})`

Moves the arm to the coordinates specified. Use this in combination with `.penUp()` and `.penDown()` if you find `.moveTo()` and `.lineTo()` don't suit your needs.

> **Note:** You may also specify the `z` coordinate here, for manual height control, but it's not recommended. The machine will accept anything from 0–1000 for the `z` axis. This library considers any `z` coordinate < 500 to be 'down'. All other movement commands use `z: 0` and `z: 1000` exclusively when changing the pen height, so you could see unintended behaviors mixing the two strategies.

**Parameters:** an object with at least one of `x`, `y`, or `z` coordinates specified:

```js
{
  x: 800,
  y: 900,
  z: 0
}
```

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### `.home()`

Lifts the pen up and moves to the home position at coordinates `{ x: 350, y: 0}`.

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### `.getPosition()`

Fetches the machine's current coordinates. Because this command might end up buffered in the queue, you should instead listen for [`coordinate` events](#oncoordinates-obj) for immediate machine coordinate updates as they happen.

**Returns:** A promise. See [Movement Responses](#movement-responses) for details.

### Movement Responses

All movement commands return a promise that resolves into the Line-us machine's response. The response will be parsed into an object and will reflect the machine's new coordinates:

```js
{
  x: '350',
  y: '500',
  z: '0'
}
```

More details about the returned message object can be found in the [`.send()`](#sendcmd) command documentation.

## Queue Control

The Line-us machine has no buffer, and will only acknowledge one command at a time. This library uses a queue to buffer commands and ensure that only one is sent at a time.

The Line-us machine relies on TCP for buffering. Historically it was recommended to only send one command at a time so this library uses a queue to buffer commands. With Line-us firmware 3.0.0 or greater that restriction has been relaxed and there is now a `concurrency` parameter.

Before starting the queue you could pre-fill it with all the commands for a drawing, or you may want to start it right away and use it just as a buffer while you send commands in "real-time". You can pause, resume, and clear the queue.

### `.start()`

Starts the queue. Any messages in the queue will immediately start sending to the machine. If the queue is empty it will wait for commands.

### `.pause()`

Temporarily pause the queue. The current message(s) will finish sending and the machine will finish executing the move(s), so there may be a delay between pausing and the actual cessation of movement. The delay will be greater with higher values of `concurrency`

By default if the current `z` height is less than 500, a `penUp()` command will be injected to lift the arm for the duration of the pause. The previous `z` height will be restored when the queue is resumed.

To disable the automatic lifting of the arm during pauses, pass in a configuration object with `lift: false`:

```js
bot.pause({ lift: false })
```

**Parameters:** an optional object with the following keys:

- **`lift`**: (optional) a boolean that determines if the arm should be lifted up during the pause. **Defaults to `true`**

**Returns:** a promise that resolves when the queue has flushed and the machine is actually paused.

### `.resume()`

Unpause the queue and resume sending messages where it left off. Restores the `z` axis to its previous height if the arm was lifted during the pause.

### `.stop()`

Stop the queue and clear it.

### `.clear()`

Clear all commands out of the queue. The queue remains in its current state with regards to being `paused` or `drawing`.

## Configuration

These commands get information from the machine, and set various configuration options.

### `.info`

A property of the `Line-us` instance which is populated with info provided by the machine's `hello` message:

```js
{
  version: '2.0.2Beta6 Sep 14 2018 22:17:02',
  name: 'line-us',
  serial:'999999'
}
```

Not available until the websocket is connected.

### `.getCapabilities()`

Fetches information about the machine's wifi connection mode and machine name.

**Returns:** a promise that resolves into the machine's response:

```js
{
  CONNECTMODE: 'ST',
  MACHINENAME: 'line-us'
}
```

See the official [Line-us G-code specification](https://github.com/Line-us/Line-us-Programming/blob/master/Documentation/GCodeSpec.pdf) for details on the possible values.

### `.getDiagnostics()`

Fetches extensive diagnostic information about the Line-us machine.

**Returns:** a promise that resolves into the machine's response:

```js
{
  ChipID: '990192',
  WifiMode: '1',
  WifiModeSet: '0',
  WifisConfigured: '2',
  MemDraw: '0',
  Gestures: '0',
  name: 'line-us',
  mac: '00:BE:EF:C0:FF:EE',
  FlashChipID: '1458415',
  FlashChipMode: '0',
  FlashChipSpeed: '40000000',
  FreeHeap: '26280',
  ResetReason: 'External System',
  FSUsed: '1255',
  FSTotal: '1953282',
  FSFree: '1952027',
  FSPercent: '0',
  FS: '/cal-30;/key-344; ',
  Serial: 'cd-pAd',
  Cal: '-19.70022,9.099869,-9.200562'
}
```

Currently, determining the meaning of these values is left to you, dear user, as the official [specification](https://github.com/Line-us/Line-us-Programming/blob/master/Documentation/GCodeSpec.pdf) has no further details on this command.

### `.setCalibration()`

Sets the calibration of the Line-us machine. You must manually move the arm to its calibration point before running this command. See the [Line-us help page](https://www.line-us.com/help.html#10) for more information on how to calibrate your machine.

**Returns:** a promise that resolves into the machine's response.

### `.clearCalibration()`

Clears the current calibration. You can inspect your calibration data using the [`.getDiagnostics()`](#getdiagnostics) command:

```js
response = await bot.getDiagnostics()
calibration = response.Cal
```

**Returns:** a promise that resolves into the machine's response.

### `.setMachineName('name')`

Sets the LineUs machine's name to the specified string.

**Returns:** a promise that resolves into the machine's response.

### `.getMachineName()`

Gets the LineUs machine's current name.

**Returns:** a promise that resolves into the machine's response.

### `.saveWifiNetwork({ssid, password})`

Saves a new wifi network to the machine.

**Parameters:**

- **`ssid`**: (required) the wifi network's SSID name
- **`password`**: (optional) the wifi network's password if needed

**Returns:** a promise that resolves into the machine's response.

### `.listWifiNetworks()`

Lists the wifi networks currently saved on the machine.

**Returns:** a promise that resolves into the machine's response.

### `.forgetWifiNetwork({ssid})`

Forgets the specified wifi network.

**Parameters:**

- **`ssid`**: (required) the SSID if the network to be forgotten. `*` may be used to instruct the machine to forget all saved networks.

**Returns:** a promise that resolves into the machine's response.

## Events

### `.on('state', (string) => {})`

The `state` event fires whenever there is a state change. It passes the new state as one of the following strings:

- **`disconnected`**: the websocket is not connected, either because we're just starting up or because the connection was lost or closed.
- **`connecting`**: a websocket connection is being established
- **`connected`**: the websocket is connected to the Line-us machine and has received the initial `hello` message.
- **`paused`**: the queue is paused and no messages will be sent to the machine.
- **`drawing`**: the queue is started and messages are being sent to the machine.

> **Note:** all the states emitted under the `state` event are also emitted under their own name. So if you want to listen only for the `connected` event, for example, you may do `.on('connected', () => {})`.

### `.on('error', (string) => {})`

Emits errors from the websocket or Line-us machine.

#### `.on('coordinates', (obj) => {})`

Emits a coordinate object every time the Line-us machine replies with its current coordinates. The object will be in the following form:

```js
{
  x: 800,
  y: 150,
  z: 1000
}
```

It will always have all three coordinates, even if the command that triggered the event provided only one or two. The coordinates are emitted _when the machine finishes executing the current command_.

## TODO

- [x] Better error handling
- [x] Validate inputs
- [x] Tests
- [ ] Functional tests
- [x] Fix browser tests
- [ ] Emit simple progress updates using queue size / total
- [ ] Emit smarter progress updates with time estimates
