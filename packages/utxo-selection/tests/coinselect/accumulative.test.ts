import fixtures from './__fixtures__/accumulative';
import * as utils from './testUtils';
import { accumulative } from '../../src/coinselect/algorithms/accumulative';
import { CoinSelectOptions } from '../../src/coinselect/types';

describe('coinselect: accumulative', () => {
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

            const actual = accumulative(inputs, outputs, f.feeRate, options);
            expect(utils.serialize(actual)).toEqual(expected);

            if (actual.inputs) {
                const feedback = accumulative(actual.inputs, actual.outputs, f.feeRate, options);
                expect(utils.serialize(feedback)).toEqual(expected);
            }
        });
    });
});
