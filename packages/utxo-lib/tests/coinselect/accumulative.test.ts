import { accumulative } from '../../src/coinselect/inputs/accumulative';
import fixtures from '../__fixtures__/coinselect/accumulative';
import * as utils from './test.utils';

describe('coinselect: accumulative', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true);
            const outputs = utils.expand(f.outputs as any, false);
            const expected = utils.addScriptLengthToExpected(f.expected);
            const options = {
                txType: 'p2pkh',
                dustThreshold: f.dustThreshold,
                baseFee: f.baseFee,
                floorBaseFee: f.floorBaseFee,
                dustOutputFee: f.dustOutputFee,
            } as const;

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
