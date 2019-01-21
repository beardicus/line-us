const tap = require('tap')
const assert = require('assert')

tap.mochaGlobals()

const validate = require('../lib/validate.js')

describe('.xy()', function() {
  const rejects = [
    [, 'no argument'],
    [{}, 'empty object'],
    [{ z: 0 }, 'no x or y'],
    [{ x: '', y: 0 }, 'x is not a number'],
    [{ x: 0, y: '' }, 'y is not a number'],
  ]

  rejects.forEach((test) => {
    it('throws on ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.throws(function() {
        validate.xy(test[0])
      }, /^TypeError/)
    })
  })

  const accepts = [
    [{ x: 0 }, 'only x'],
    [{ y: -10 }, 'only y'],
    [{ x: 10, y: -20 }, 'x and y'],
    [{ x: '0', y: '1' }, 'x and y are numberable strings'],
    [{ x: 0, q: '' }, 'additional values are ignored'],
  ]

  accepts.forEach((test) => {
    it('accepts ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.doesNotThrow(function() {
        validate.xy(test[0])
      })
    })
  })
})

describe('.xyz()', function() {
  const rejects = [
    [, 'no argument'],
    [{}, 'empty object'],
    [{ q: 0 }, 'no x or y or z'],
    [{ x: '', y: 0, z: 0 }, 'x is not a number'],
    [{ x: 0, y: '', z: 0 }, 'y is not a number'],
    [{ x: 0, y: 0, z: '' }, 'z is not a number'],
  ]

  rejects.forEach((test) => {
    it('throws on ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.throws(function() {
        validate.xyz(test[0])
      }, /^TypeError/)
    })
  })

  const accepts = [
    [{ x: 0 }, 'only x'],
    [{ y: -10 }, 'only y'],
    [{ z: 10 }, 'only z'],
    [{ x: 10, y: -20 }, 'x and y'],
    [{ x: 10, y: -20, z: 10 }, 'x and y and z'],
    [{ x: '0', y: '1', z: '2' }, 'x and y and z are numberable strings'],
    [{ z: 0, q: '' }, 'additional values are ignored'],
  ]

  accepts.forEach((test) => {
    it('accepts ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.doesNotThrow(function() {
        validate.xyz(test[0])
      })
    })
  })
})

describe('.cmd()', function() {
  const rejects = [
    [, 'no argument'],
    [{}, 'empty object'],
    [{ a: 0 }, 'no g'],
    [{ g: 0 }, 'g is not a string'],
    [{ g: 'G01', params: {} }, 'empty params object'],
  ]

  rejects.forEach((test) => {
    it('throws on ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.throws(function() {
        validate.cmd(test[0])
      }, /^TypeError/)
    })
  })

  const accepts = [
    [{ g: 'G01' }, 'only g'],
    [{ g: 'G01', params: { a: 'foo' } }, 'g plus params'],
    [{ g: 'M255', params: { a: 'x', b: 'y' } }, 'multiple params'],
  ]

  accepts.forEach((test) => {
    it('accepts ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.doesNotThrow(function() {
        validate.cmd(test[0])
      })
    })
  })
})

describe('.name()', function() {
  const rejects = [
    [, 'no argument'],
    [1, 'number'],
    [['name'], 'list'],
    [{ name: '' }, 'object'],
  ]

  rejects.forEach((test) => {
    it('throws on ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.throws(function() {
        validate.name(test[0])
      }, /^TypeError/)
    })
  })

  const accepts = ['robit', 'sally', 'line-us']

  accepts.forEach((test) => {
    it('accepts ' + JSON.stringify(test), function() {
      assert.doesNotThrow(function() {
        validate.name(test)
      })
    })
  })
})

describe('.wifi()', function() {
  const rejects = [
    [, 'no argument'],
    [{}, 'empty object'],
    [{ password: 'pass' }, 'no ssid'],
    [{ ssid: 8 }, 'ssid is a number'],
  ]

  rejects.forEach((test) => {
    it('throws on ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.throws(function() {
        validate.wifi(test[0])
      }, /^TypeError/)
    })
  })

  const accepts = [
    [{ ssid: 'hello' }, 'only ssid'],
    [{ ssid: 'hello', password: 'pass' }, 'ssid and password'],
  ]

  accepts.forEach((test) => {
    it('accepts ' + test[1] + ': ' + JSON.stringify(test[0]), function() {
      assert.doesNotThrow(function() {
        validate.wifi(test[0])
      })
    })
  })
})

tap.end() // seems to kick the browser tests in the pants when done
