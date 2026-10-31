import {
    legacyCreateStakeAccountTx,
    serializedV1Tx,
    v0WithLookupTablesTx,
    v0WithoutLookupTablesTx,
    v1WithConfigMessage,
} from './__fixtures__/signing.fixture';
import { getDecompiledMessage } from './signing';

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

    it('leaves the priority fee to the ComputeBudget instructions of a legacy or v0 message', () => {
        expect(getDecompiledMessage(v0WithoutLookupTablesTx, false)?.priorityFee).toBeUndefined();
    });

    it('decompiles a serialized v1 transaction', () => {
        const decompiled = getDecompiledMessage(serializedV1Tx, true);

        expect(decompiled?.baseFee.toString()).toBe('5000');
        expect(decompiled?.priorityFee?.toString()).toBe('0');
        expect(decompiled?.instructions).toEqual([
            expect.objectContaining({ type: 'transfer-sol' }),
        ]);
    });

    it('takes the v1 priority fee from the config and ignores ComputeBudget instructions', () => {
        const decompiled = getDecompiledMessage(v1WithConfigMessage, false);

        expect(decompiled?.priorityFee?.toString()).toBe('12345');
        expect(decompiled?.instructions).toEqual([
            expect.objectContaining({ type: 'transfer-sol' }),
        ]);
    });
});
