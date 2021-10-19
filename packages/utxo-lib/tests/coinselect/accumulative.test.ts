import { accumulative } from '../../src/coinselect/inputs/accumulative';
import fixtures from '../__fixtures__/coinselect/accumulative';
import * as utils from './test.utils';

describe('coinselect: accumulative', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true, f.inputLength);
            // @ts-expect-error f.outputs may have invalid types
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
                baseFee: f.baseFee,
                floorBaseFee: f.floorBaseFee,
                dustOutputFee: f.dustOutputFee,
            };

            const actual = accumulative(inputs, outputs, f.feeRate as any, options);

            expect(actual).toEqual(expected);
            if (actual.inputs) {
                const feedback = accumulative(
                    actual.inputs,
                    actual.outputs,
                    f.feeRate as any,
                    options,
                );
                expect(feedback).toEqual(expected);
            }
        });
    });
});
