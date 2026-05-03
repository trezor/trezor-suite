// Ported from packages/connect-plugin-stellar/__tests__/inputs.test.ts when
// the plugin was deprecated and its transformation logic moved into @trezor/connect.

import { transformTransactionInputs } from './transformTransaction.fixtures';
import { transformTransaction } from '../stellarSignTx';

describe('stellar/transformTransaction (firmware-format parity)', () => {
    transformTransactionInputs.forEach(f => {
        it(f.description, () => {
            const resp = transformTransaction(f.path, f.tx);
            expect(resp).toEqual(f.result);
        });
    });
});
