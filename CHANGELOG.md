# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] 2019-01-29

### Changed

- `.pause()` now lifts the arm by default, and returns it to the previous `z` height upon `.resume()`. It returns a promise that resolves when the machine is actually paused.

### Fixed

- `npm run test-browser` now finishes and exits properly.
- The README erroneously stated that coordinates were emitted from the machine as soon as a command is accepted at the beginning of a movement. The response actually comes when the movement is complete. Updated README to reflect that `coordinate` events are emitting the coords of the _last completed movement_.

## [1.0.0] 2019-01-20

### Added

- Everything.
