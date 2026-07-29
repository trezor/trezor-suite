import type { CoinSelectOptions } from '../../types';
import * as utils from '../__fixtures__/test.utils';
import fixtures from './__fixtures__/bnb';
import { branchAndBound } from './branchAndBound';

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
        const inputs = utils.expand([{}], true);
        const outputs = utils.expand(['100000'], false);
        const options = {
            txType: 'p2pkh',
            dustThreshold: 546,
        } as CoinSelectOptions;

        expect(branchAndBound(inputs, outputs, 10, options)).toEqual({ fee: 0 });
    });
});
