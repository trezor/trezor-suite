import { coinselect } from '../../src/coinselect';
import fixtures from '../__fixtures__/coinselect/coinselect-index';
import fixturesErrors from '../__fixtures__/coinselect/coinselect-errors';
import * as utils from './test.utils';

describe('coinselect errors', () => {
    fixturesErrors.forEach(f => {
        it(f.description, () => {
            const { inputLength, outputLength, dustThreshold } = f;
            const inputs = utils.expand(f.inputs, true, inputLength as any);
            const outputs = utils.expand(f.outputs, false, outputLength as any);

            expect(() =>
                coinselect(inputs, outputs, f.feeRate, {
                    inputLength,
                    changeOutputLength: outputLength,
                    dustThreshold,
                } as any),
            ).toThrowError(f.expected);
        });
    });
});

describe('coinselect index', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const { inputLength, outputLength, dustThreshold } = f;

            const inputs = utils.expand(f.inputs as any, true, inputLength);
            const outputs = utils.expand(f.outputs as any, false, outputLength);
            const expected = utils.addScriptLengthToExpected(f.expected, inputLength, outputLength);

            const actual = coinselect(inputs, outputs, f.feeRate as any, {
                inputLength,
                changeOutputLength: outputLength,
                dustThreshold,
            });

            expect(actual).toEqual(expected);
            if (actual.inputs) {
                // @ts-ignore
                const feedback = coinselect(actual.inputs, actual.outputs, f.feeRate as any, {
                    inputLength,
                    changeOutputLength: outputLength,
                    dustThreshold,
                });
                expect(feedback).toEqual(expected);
            }
        });
    });
});
