import { bnb } from '../../src/coinselect/inputs/bnb';
import fixtures from '../__fixtures__/coinselect/bnb';
import * as utils from './test.utils';

describe('coinselect: branchAndBound (bnb)', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true, f.inputLength);
            const outputs = utils.expand(f.outputs, false, f.outputLength);
            const expected = utils.addScriptLengthToExpected(
                f.expected,
                f.inputLength,
                f.outputLength,
            );
            const options = {
                inputLength: f.inputLength,
                changeOutputLength: f.outputLength,
                dustThreshold: f.dustThreshold,
            };

            const actual = bnb(f.factor)(inputs, outputs, f.feeRate, options);
            expect(actual).toEqual(expected);
            if (actual.inputs) {
                const feedback = bnb(f.factor)(actual.inputs, actual.outputs, f.feeRate, options);
                expect(feedback).toEqual(expected);
            }
        });
    });
});
