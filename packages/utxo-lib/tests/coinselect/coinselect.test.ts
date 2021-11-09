import { coinselect } from '../../src/coinselect';
import fixtures from '../__fixtures__/coinselect/coinselect-index';
import fixturesErrors from '../__fixtures__/coinselect/coinselect-errors';
import * as utils from './test.utils';

describe('coinselect errors', () => {
    fixturesErrors.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs, true);
            const outputs = utils.expand(f.outputs, false);

            expect(() =>
                coinselect(inputs, outputs, f.feeRate, {
                    txType: 'p2pkh',
                    dustThreshold: f.dustThreshold,
                }),
            ).toThrowError(f.expected);
        });
    });
});

describe('coinselect index', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const inputs = utils.expand(f.inputs as any, true);
            const outputs = utils.expand(f.outputs as any, false);
            const expected = utils.addScriptLengthToExpected(f.expected);

            const actual = coinselect(inputs, outputs, f.feeRate as number, {
                txType: 'p2pkh',
                dustThreshold: f.dustThreshold,
            });

            expect(actual).toEqual(expected);
            if (actual.inputs) {
                const feedback = coinselect(actual.inputs, actual.outputs, f.feeRate as number, {
                    txType: 'p2pkh',
                    dustThreshold: f.dustThreshold,
                });
                expect(feedback).toEqual(expected);
            }
        });
    });
});
