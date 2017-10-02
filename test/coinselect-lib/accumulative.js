/* global it:false, describe:false */

import assert from 'assert';

import coinAccum from '../../lib/build-tx/coinselect-lib/inputs/accumulative';
import fixtures from './fixtures/accumulative';
import utils from './_utils';

describe('coinselect accumulative', () => {
    fixtures.forEach((f) => {
        it(f.description, () => {
            const inputLength = f.inputLength;
            const outputLength = f.outputLength;

            const inputs = utils.expand(f.inputs, true, inputLength);
            const outputs = utils.expand(f.outputs, false, outputLength);
            const expected = utils.addScriptLengthToExpected(f.expected, inputLength, outputLength);

            const actual = coinAccum(inputs, outputs, f.feeRate, {inputLength, outputLength});

            assert.deepEqual(actual, expected);
            if (actual.inputs) {
                const feedback = coinAccum(actual.inputs, actual.outputs, f.feeRate, {inputLength, outputLength});
                assert.deepEqual(feedback, expected);
            }
        });
    });
});
