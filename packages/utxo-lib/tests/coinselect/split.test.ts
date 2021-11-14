import { split } from '../../src/coinselect/outputs/split';
import fixtures from '../__fixtures__/coinselect/split';
import * as utils from './test.utils';

describe('coinselect split', () => {
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
            const actual = split(inputs, outputs, f.feeRate as number, options);
            expect(actual).toEqual(expected);
            if (actual.inputs) {
                const feedback = split(actual.inputs, actual.outputs, f.feeRate as number, options);
                expect(feedback).toEqual(expected);
            }
        });
    });
});
