import {
    legacyCreateStakeAccountTx,
    serializedLegacyTx,
    serializedV1Tx,
    v0WithLookupTablesTx,
    v0WithoutLookupTablesTx,
    v1Message,
} from './__fixtures__/signing.fixture';
import { getDecompiledMessage, isV1Transaction } from './signing';

describe(getDecompiledMessage.name, () => {
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

describe(isV1Transaction.name, () => {
    it('detects a v1 message by its version byte', () => {
        expect(isV1Transaction(v1Message)).toBe(true);
    });

    it('detects a serialized v1 transaction, which leads with the message', () => {
        expect(isV1Transaction(serializedV1Tx)).toBe(true);
    });

    it('does not flag a legacy message', () => {
        expect(isV1Transaction(legacyCreateStakeAccountTx)).toBe(false);
    });

    it.each([
        ['without lookup tables', v0WithoutLookupTablesTx],
        ['with lookup tables', v0WithLookupTablesTx],
    ])('does not flag a v0 message %s', (_name, tx) => {
        expect(isV1Transaction(tx)).toBe(false);
    });

    it('does not flag a serialized legacy transaction, whose first byte is the signature count', () => {
        expect(isV1Transaction(serializedLegacyTx)).toBe(false);
    });

    it('does not flag an empty payload', () => {
        expect(isV1Transaction('')).toBe(false);
    });
});
