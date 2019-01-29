const {
  check,
  isObject,
  isNumber,
  isString,
  isBoolean,
  hasSomeKeys,
  hasKeys,
  checkKeys,
} = require('./check.js')

module.exports = {
  xy: (input) => {
    check(input, [
      isObject,
      hasSomeKeys(['x', 'y']),
      checkKeys({
        x: isNumber,
        y: isNumber,
      }),
    ])
  },

  xyz: (input) => {
    check(input, [
      isObject,
      hasSomeKeys(['x', 'y', 'z']),
      checkKeys({
        x: isNumber,
        y: isNumber,
        z: isNumber,
      }),
    ])
  },

  cmd: (input) => {
    check(input, [
      isObject,
      hasKeys('g'),
      checkKeys({
        g: isString,
        params: isObject,
      }),
    ])
  },

  lift: (input) => {
    check(input, isBoolean)
  },

  name: (input) => {
    check(input, isString)
  },

  wifi: (input) => {
    check(input, [
      isObject,
      hasKeys('ssid'),
      checkKeys({
        ssid: isString,
        password: isString,
      }),
    ])
  },
}
