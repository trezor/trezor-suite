import {
    legacyCreateStakeAccountTx,
    v0WithLookupTablesTx,
    v0WithoutLookupTablesTx,
} from './__fixtures__/signing.fixture';
import { getDecompiledMessage } from './signing';

describe('getDecompiledMessage', () => {
    it('decompiles a legacy transaction message', () => {
        const decompiled = getDecompiledMessage(legacyCreateStakeAccountTx, false);

        expect(decompiled).toBeDefined();
        expect(decompiled?.baseFee.toString()).toBe('10000');
        expect(decompiled?.instructions).toHaveLength(2);
    });

    it('decompiles a v0 transaction message without lookup tables', () => {
        const decompiled = getDecompiledMessage(v0WithoutLookupTablesTx, false);

        expect(decompiled?.instructions).toEqual([
            expect.objectContaining({ type: 'transfer-sol' }),
        ]);
    });

    it('returns undefined for a v0 transaction with address lookup tables', () => {
        expect(getDecompiledMessage(v0WithLookupTablesTx, false)).toBeUndefined();
    });
});
