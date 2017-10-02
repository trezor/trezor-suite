/* global it:false, describe:false */

import assert from 'assert';

import coinAccum from '../../lib/build-tx/coinselect-lib/inputs/accumulative';
import fixtures from './fixtures/accumulative';
import utils from './_utils';

describe('coinselect accumulative', () => {
  fixtures.forEach((f) => {
    it(f.description, () => {
      var inputLength = f.inputLength
      var outputLength = f.outputLength

      var inputs = utils.expand(f.inputs, true, inputLength)
      var outputs = utils.expand(f.outputs, false, outputLength)
      var expected = utils.addScriptLengthToExpected(f.expected, inputLength, outputLength)

      var actual = coinAccum(inputs, outputs, f.feeRate, {inputLength, outputLength})

      assert.deepEqual(actual, expected)
      if (actual.inputs) {
        var feedback = coinAccum(actual.inputs, actual.outputs, f.feeRate, {inputLength, outputLength})
        assert.deepEqual(feedback, expected)
      }

    })
  })
})
