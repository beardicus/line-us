const is = require('@sindresorhus/is')

module.exports = {
  check,
  isObject,
  isNumber,
  isString,
  hasKeys,
  hasSomeKeys,
  checkKeys,
}

function check(derp, tests) {
  if (!Array.isArray(tests)) tests = [tests]

  tests.forEach((test) => {
    test(derp)
  })
}

function isObject(input) {
  if (!is.plainObject(input)) throw new TypeError('input is not an object')
  if (!is.nonEmptyObject(input)) throw new TypeError('input object is empty')
}

function isNumber(input) {
  if (!(is.number(input) || is.numericString(input)))
    throw new TypeError('input is not a number')
}

function isString(input) {
  if (!is.nonEmptyString(input))
    throw new TypeError('input is not a string or is empty')
}

function hasKeys(keys) {
  return (input) => {
    if (typeof keys === 'string') keys = [keys] // allow single key as string
    const check = keys.every((key) => {
      if (input.hasOwnProperty(key)) return true
    })

    if (!check) throw new TypeError('input object is missing required keys')
  }
}

function hasSomeKeys(keys) {
  return (input) => {
    const check = keys.some((key) => {
      if (input.hasOwnProperty(key)) return true
    })

    if (!check)
      throw new TypeError('input object has none of the expected keys')
  }
}

function checkKeys(keys) {
  return (input) => {
    Object.keys(keys).forEach((key) => {
      if (input.hasOwnProperty(key)) {
        check(input[key], keys[key])
      }
    })
  }
}
