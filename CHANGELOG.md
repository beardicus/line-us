# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] 2019-06-27

### Added

- A `concurrency` parameter has been added to the constructor, with a default value of `3`. This parameter controls how many commands can be "in flight" and buffered by the Line-us machine. Setting this to higher values can smooth out operation over unreliable or high-latency connections. The default value of `3` seems good for most local Wifi situations.

### Fixed

- `.coordinates` will now be set to the home coordinates (`{x: 350, y: 0, z: 1000}`) after a connection is established, as the Line-us machine does a homing sequence as part of the connection process. Previously we would return `undefined` coordinates until after the first move.

## [2.0.0] 2019-01-29

### Changed

- `.pause()` now lifts the arm by default, and returns it to the previous `z` height upon `.resume()`. It returns a promise that resolves when the machine is actually paused.

### Fixed

- `npm run test-browser` now finishes and exits properly.
- The README erroneously stated that coordinates were emitted from the machine as soon as a command is accepted at the beginning of a movement. The response actually comes when the movement is complete. Updated README to reflect that `coordinate` events are emitting the coords of the _last completed movement_.

## [1.0.0] 2019-01-20

### Added

- Everything.
