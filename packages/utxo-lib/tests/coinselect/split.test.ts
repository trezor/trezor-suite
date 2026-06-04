import * as utils from './test.utils';
import { INPUT_SCRIPT_LENGTH, OUTPUT_SCRIPT_LENGTH } from '../../src/coinselect/coinselectUtils';
import { split } from '../../src/coinselect/outputs/split';
import type { CoinSelectInput, CoinSelectOptions, CoinSelectOutput } from '../../src/types';
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

    it('returns fee-only result when input value is non-numeric (sumOrNaN→undefined drives !inAccum branch)', () => {
        const inputs = [
            {
                i: 0,
                type: 'p2pkh',
                value: 'not_a_number',
                script: { length: INPUT_SCRIPT_LENGTH.p2pkh },
            },
        ] as unknown as CoinSelectInput[];
        const outputs = [
            { script: { length: OUTPUT_SCRIPT_LENGTH.p2pkh } },
        ] as unknown as CoinSelectOutput[];
        const options = {
            txType: 'p2pkh',
            dustThreshold: 546,
        } as CoinSelectOptions;

        const result = split(inputs, outputs, 10, options);

        expect(result.inputs).toBeUndefined();
        expect(result.outputs).toBeUndefined();
        expect(typeof result.fee).toBe('number');
    });
});
