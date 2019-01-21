const tap = require('tap')
const assert = require('assert')

tap.mochaGlobals()

const {
  check,
  isObject,
  isNumber,
  isString,
  hasSomeKeys,
  hasKeys,
  checkKeys,
} = require('../lib/check.js')

describe('check()', function() {
  it('throws when a test fails', function() {
    assert.throws(() => check('', isNumber), /^TypeError/)
  })

  it('does nothing when tests pass', function() {
    assert.doesNotThrow(() => check('a', isString))
  })

  it('runs multiple tests when passed a list', function() {
    assert.doesNotThrow(() => check({ a: 1 }, [isObject, hasKeys('a')]))
  })
})

describe('isObject()', function() {
  it('throws on array', function() {
    assert.throws(() => isObject([]), /^TypeError/)
  })

  it('throws on string', function() {
    assert.throws(() => isObject(''), /^TypeError/)
  })

  it('throws on number', function() {
    assert.throws(() => isObject(0), /^TypeError/)
  })

  it('throws on function', function() {
    assert.throws(() => isObject(function() {}), /^TypeError/)
  })

  it("does not throw on {a: ''}", function() {
    assert.doesNotThrow(() => isObject({ a: '' }))
  })
})

describe('hasSomeKeys()', function() {
  it('throws if a key is not found', function() {
    assert.throws(function() {
      hasSomeKeys(['x', 'y'])({ z: 0 })
    }, /^TypeError/)
  })

  it('does not throw if a key is found', function() {
    assert.doesNotThrow(function() {
      hasSomeKeys(['x', 'y'])({ x: 0 })
    })
  })

  it('accepts keys as a list of strings', function() {
    assert.doesNotThrow(function() {
      hasSomeKeys(['x', 'y'])({ x: 0 })
    })
  })

  it('ignores extraneous keys', function() {
    assert.doesNotThrow(function() {
      hasSomeKeys(['x', 'y'])({ x: 0, z: 0 })
    })
  })
})

describe('hasKeys()', function() {
  it('throws if any key is not found', function() {
    assert.throws(function() {
      hasKeys(['x', 'y'])({ x: 0 })
    }, /^TypeError/)
  })

  it('does not throw if all keys are found', function() {
    assert.doesNotThrow(function() {
      hasKeys(['x', 'y'])({ x: 0, y: 0 })
    })
  })

  it('accepts a key as a string', function() {
    assert.doesNotThrow(function() {
      hasKeys('x')({ x: 0 })
    })
  })

  it('accepts keys as a list of strings', function() {
    assert.doesNotThrow(function() {
      hasKeys(['x', 'y'])({ x: 0, y: 0 })
    })
  })

  it('ignores extraneous keys', function() {
    assert.doesNotThrow(function() {
      hasKeys(['x', 'y'])({ x: 0, y: 0, z: 0 })
    })
  })
})

describe('isNumber()', function() {
  const rejects = ['string', {}, []]

  rejects.forEach((test) => {
    it('rejects non numbers: ' + JSON.stringify(test), function() {
      assert.throws(() => isNumber(test), /^TypeError/)
    })
  })

  const accepts = [
    0,
    '0',
    1,
    '1',
    0.1,
    '0.1',
    -1,
    '-1',
    999999,
    '99999',
    1e5,
    '1e5',
  ]

  accepts.forEach((test) => {
    it('accepts numbers: ' + JSON.stringify(test), function() {
      assert.doesNotThrow(() => isNumber(test))
    })
  })
})

describe('isString()', function() {
  const rejects = [1, {}, []]

  rejects.forEach((test) => {
    it('rejects non strings: ' + JSON.stringify(test), function() {
      assert.throws(() => isString(test), /^TypeError/)
    })
  })

  const accepts = ['string', '🎉']

  accepts.forEach((test) => {
    it('accepts non-empty strings: ' + JSON.stringify(test), function() {
      assert.doesNotThrow(() => isString(test))
    })
  })
})

describe('checkKeys()', function() {
  it('throws if key does not match test', function() {
    assert.throws(function() {
      const test = checkKeys({
        x: [isNumber],
      })
      test({ x: '' })
    }, /^TypeError/)
  })

  it('does not throw if key passes test', function() {
    assert.doesNotThrow(function() {
      const test = checkKeys({
        x: [isNumber],
      })
      test({ x: 0 })
    })
  })

  it('handles multiple keys', function() {
    assert.doesNotThrow(function() {
      const test = checkKeys({
        x: [isNumber],
        y: [isObject],
      })
      test({ x: 0, y: { a: '' } })
    })
  })

  it('ignores missing keys', function() {
    assert.doesNotThrow(function() {
      const test = checkKeys({
        x: [isNumber],
        y: [isObject],
      })
      test({ x: 0 })
    })
  })

  it('allows key checks to not be a list', function() {
    assert.doesNotThrow(function() {
      const test = checkKeys({
        x: isNumber,
        y: isObject,
      })
      test({ x: 0 })
    })
  })
})
