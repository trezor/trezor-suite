import * as utils from './test.utils';
import { split } from '../../src/coinselect/outputs/split';
import { CoinSelectOptions } from '../../src/types';
import fixtures from '../__fixtures__/coinselect/split';

describe('coinselect split', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true);
            const outputs = utils.expand(f.outputs as any, false);
            const expected = utils.addScriptLengthToExpected(f.expected);
            const options = {
                txType: f.txType || 'p2pkh',
                dustThreshold: f.dustThreshold,
                baseFee: f.baseFee,
                floorBaseFee: f.floorBaseFee,
                feePolicy: f.feePolicy,
            } as CoinSelectOptions;

            const actual = split(inputs, outputs, f.feeRate, options);
            expect(utils.serialize(actual)).toEqual(expected);

            if (actual.inputs) {
                const feedback = split(actual.inputs, actual.outputs, f.feeRate, options);
                expect(utils.serialize(feedback)).toEqual(expected);
            }
        });
    });
});
