import * as utils from './test.utils';
import { branchAndBound } from '../../src/coinselect/inputs/branchAndBound';
import type { CoinSelectOptions } from '../../src/types';
import fixtures from '../__fixtures__/coinselect/bnb';

describe('coinselect: branchAndBound (bnb)', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true);
            const outputs = utils.expand(f.outputs, false);
            const expected = utils.addScriptLengthToExpected(f.expected);
            const options = {
                txType: 'p2pkh',
                dustThreshold: f.dustThreshold,
            } as CoinSelectOptions;

            const actual = branchAndBound(inputs, outputs, f.feeRate, options);
            expect(utils.serialize(actual)).toEqual(expected);

            if (actual.inputs) {
                const feedback = branchAndBound(actual.inputs, actual.outputs, f.feeRate, options);
                expect(utils.serialize(feedback)).toEqual(expected);
            }
        });
    });

    it('with options.baseFee set returns { fee: 0 } (bnb disabled for DOGE)', () => {
        // Exercises the truthy arm of `if (options.baseFee) return { fee: 0 }` at
        // src/coinselect/inputs/branchAndBound.ts:137. The bnb algorithm is
        // disabled for DOGE (baseFee > 0) so even with inputs/outputs that would
        // otherwise solve to a non-zero fee selection, the function must
        // short-circuit to { fee: 0 } before any cost-of-change math.
        const inputs = utils.expand(['102001'], true);
        const outputs = utils.expand(['100000'], false);
        const options = {
            txType: 'p2pkh',
            dustThreshold: 546,
            baseFee: 100,
        } as CoinSelectOptions;

        expect(branchAndBound(inputs, outputs, 10, options)).toEqual({ fee: 0 });
    });

    it('with an unparseable utxo value treats it as ZERO effective value (filtered out)', () => {
        // Exercises the truthy arm of `if (!value)` at
        // src/coinselect/inputs/branchAndBound.ts:22 in calculateEffectiveValues.
        // A utxo without a value makes bignumberOrNaN return undefined; the
        // function assigns effectiveValue = ZERO, which is then filtered out by
        // the `effectiveValue.gt(ZERO)` check. With no remaining effective utxos,
        // utxosTotalEffectiveValue.lt(target) short-circuits to { fee: 0 }.
        const inputs = utils.expand([{}], true);
        const outputs = utils.expand(['100000'], false);
        const options = {
            txType: 'p2pkh',
            dustThreshold: 546,
        } as CoinSelectOptions;

        expect(branchAndBound(inputs, outputs, 10, options)).toEqual({ fee: 0 });
    });
});
