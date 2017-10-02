/* global it:false, describe:false */

import assert from 'assert';

import coinAccum from '../../lib/build-tx/coinselect-lib/inputs/bnb';
import fixtures from './fixtures/bnb';
import utils from './_utils';

describe('coinselect bnb', () => {
  fixtures.forEach((f) => {
    it(f.description, () => {
      var inputLength = f.inputLength
      var outputLength = f.outputLength
      var factor = f.factor

      var inputs = utils.expand(f.inputs, true, inputLength)
      var outputs = utils.expand(f.outputs, false, outputLength)
      var expected = utils.addScriptLengthToExpected(f.expected, inputLength, outputLength)

      var actual = coinAccum(f.factor)(inputs, outputs, f.feeRate, {inputLength, outputLength})

      assert.deepEqual(actual, expected)
      if (actual.inputs) {
        var feedback = coinAccum(f.factor)(actual.inputs, actual.outputs, f.feeRate, {inputLength, outputLength})
        assert.deepEqual(feedback, expected)
      }

    })
  })
})
