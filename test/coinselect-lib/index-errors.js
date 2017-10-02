/* global it:false, describe:false */

import assert from 'assert';

import coinAccum from '../../lib/build-tx/coinselect-lib/index';
import fixtures from './fixtures/index-errors.json';
import utils from './_utils';

describe('coinselect errors', () => {
    fixtures.forEach((f) => {
        it(f.description, () => {
            const inputLength = f.inputLength;
            const outputLength = f.outputLength;

            const inputs = utils.expand(f.inputs, true, inputLength);
            const outputs = utils.expand(f.outputs, false, outputLength);

            assert.throws(() => {
                coinAccum(inputs, outputs, f.feeRate, {inputLength: inputLength, outputLength: outputLength});
            }, new RegExp(f.expected));
        });
    });
});
