import { split } from '../../src/coinselect/outputs/split';
import fixtures from '../__fixtures__/coinselect/split';
import * as utils from './test.utils';

describe('coinselect split', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true, f.inputLength);
            const outputs = utils.expand(f.outputs as any, false, f.outputLength);
            const expected = utils.addScriptLengthToExpected(
                f.expected,
                f.inputLength,
                f.outputLength,
            );
            const options = {
                inputLength: f.inputLength,
                changeOutputLength: f.outputLength,
                dustThreshold: f.dustThreshold,
                baseFee: f.baseFee,
                floorBaseFee: f.floorBaseFee,
                dustOutputFee: f.dustOutputFee,
            };
            const actual = split(inputs, outputs, f.feeRate as any, options);

            expect(actual).toEqual(expected);
            if (actual.inputs) {
                const feedback = split(actual.inputs, actual.outputs, f.feeRate as any, options);
                expect(feedback).toEqual(expected);
            }
        });
    });
});
