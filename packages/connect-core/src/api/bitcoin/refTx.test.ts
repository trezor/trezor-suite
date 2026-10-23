import * as fixtures from './__fixtures__/refTx';
import { transformRawTransactions } from './refTx';

describe('core/methods/tx/refTx', () => {
    describe('transformRawTransactions', () => {
        fixtures.transformRawTransactions.forEach(f => {
            it(` ${f.description}`, () => {
                if (f.error) {
                    expect(() => transformRawTransactions(f.params as any)).toThrow(f.error);
                } else {
                    expect(transformRawTransactions(f.params as any)).toEqual(f.result);
                }
            });
        });
    });
});
