/* global it:false, describe:false */

import assert from 'assert';

import coinAccum from '../../lib/build-tx/coinselect-lib/index';
import fixtures from './fixtures/index';
import utils from './_utils';

describe('coinselect index', () => {
    fixtures.forEach((f) => {
        it(f.description, () => {
            const inputLength = f.inputLength;
            const outputLength = f.outputLength;
            const dustThreshold = f.dustThreshold;

            const inputs = utils.expand(f.inputs, true, inputLength);
            const outputs = utils.expand(f.outputs, false, outputLength);
            const expected = utils.addScriptLengthToExpected(f.expected, inputLength, outputLength);

            const actual = coinAccum(inputs, outputs, f.feeRate, {inputLength, outputLength, dustThreshold});

            assert.deepEqual(actual, expected);
            if (actual.inputs) {
                const feedback = coinAccum(actual.inputs, actual.outputs, f.feeRate, {inputLength, outputLength, dustThreshold});
                assert.deepEqual(feedback, expected);
            }
        });
    });
});
