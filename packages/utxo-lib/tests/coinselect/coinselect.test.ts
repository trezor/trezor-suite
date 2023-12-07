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
                coinselect({
                    txType: 'p2pkh',
                    dustThreshold: f.dustThreshold,
                    feeRate: f.feeRate,
                    inputs,
                    outputs,
                    sendMaxOutputIndex: -1,
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

            const actual = coinselect({
                txType: 'p2pkh',
                dustThreshold: f.dustThreshold,
                feeRate: f.feeRate,
                inputs,
                outputs,
                sendMaxOutputIndex: -1,
            });

            expect(actual).toEqual(expected);
            if (actual.inputs) {
                const feedback = coinselect({
                    txType: 'p2pkh',
                    dustThreshold: f.dustThreshold,
                    feeRate: f.feeRate,
                    inputs: actual.inputs,
                    outputs: actual.outputs,
                    sendMaxOutputIndex: -1,
                });
                expect(feedback).toEqual(expected);
            }
        });
    });
});
