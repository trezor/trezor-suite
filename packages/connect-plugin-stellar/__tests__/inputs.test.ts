import * as fixtures from '../__fixtures__/inputs';
import { transformTransaction } from '../src/index';

describe('plugins/stellar', () => {
    describe('transformTransaction', () => {
        fixtures.transformTransactionInputs.forEach(f => {
            it(f.description, () => {
                const resp = transformTransaction(f.path, f.tx);
                expect(resp).toEqual(f.result);
            });
        });
    });
});
