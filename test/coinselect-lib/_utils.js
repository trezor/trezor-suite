function addScriptLength (values, scriptLength) {
  return values.map(function (x) {
    if (x.script === undefined) {
      x.script = { length: scriptLength }
    }
    return x
  })
}

function addScriptLengthToExpected (expected, inputLength, outputLength) {
  var newExpected = Object.assign({}, expected)

  if (expected.inputs != null) {
    newExpected.inputs = expected.inputs.map(function (input) {
      var newInput = Object.assign({}, input)
      if (newInput.script == null) {
        newInput.script = {length: inputLength}
      }
      return newInput
    })
  }

  if (expected.outputs != null) {
    newExpected.outputs = expected.outputs.map(function (output) {
      var newOutput = Object.assign({}, output)
      if (newOutput.script == null) {
        newOutput.script = {length: outputLength}
      }
      return newOutput
    })
  }

  return newExpected
}

function expand (values, indices, scriptLength) {
  if (indices) {
    return addScriptLength(values.map(function (x, i) {
      if (typeof x === 'number') return { i: i, value: x }

      var y = { i: i }
      for (var k in x) y[k] = x[k]
      return y
    }), scriptLength)
  }

  return addScriptLength(values.map(function (x, i) {
    return typeof x === 'object' ? x : { value: x }
  }), scriptLength)
}

function testValues (t, actual, expected) {
  t.equal(typeof actual, typeof expected, 'types match')
  if (!expected) return

  t.equal(actual.length, expected.length, 'lengths match')

  actual.forEach(function (ai, i) {
    var ei = expected[i]

    if (ai.i !== undefined) {
      t.equal(ai.i, ei, 'indexes match')
    } else if (typeof ei === 'number') {
      t.equal(ai.value, ei, 'values match')
    } else {
      t.same(ai, ei, 'objects match')
    }
  })
}

module.exports = {
  expand: expand,
  testValues: testValues,
  addScriptLengthToExpected: addScriptLengthToExpected
}
