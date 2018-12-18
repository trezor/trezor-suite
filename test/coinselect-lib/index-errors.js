/* global it:false, describe:false */

import assert from 'assert';

import coinAccum from '../../src/build-tx/coinselect-lib/index';
import fixtures from './fixtures/index-errors.json';
import * as utils from './_utils';

describe('coinselect errors', () => {
    fixtures.forEach((f) => {
        it(f.description, () => {
            const { inputLength, outputLength, dustThreshold } = f;

            const inputs = utils.expand(f.inputs, true, inputLength);
            const outputs = utils.expand(f.outputs, false, outputLength);

            assert.throws(() => {
                coinAccum(
                    inputs,
                    outputs,
                    f.feeRate,
                    { inputLength, changeOutputLength: outputLength, dustThreshold },
                );
            }, new RegExp(f.expected));
        });
    });
});
