import { bnb } from '../../src/coinselect/inputs/bnb';
import fixtures from '../__fixtures__/coinselect/bnb';
import * as utils from './test.utils';
import { CoinSelectOptions } from '../../src/types';

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

            const actual = bnb(inputs, outputs, f.feeRate, options);
            expect(utils.serialize(actual)).toEqual(expected);

            if (actual.inputs) {
                const feedback = bnb(actual.inputs, actual.outputs, f.feeRate, options);
                expect(utils.serialize(feedback)).toEqual(expected);
            }
        });
    });
});
