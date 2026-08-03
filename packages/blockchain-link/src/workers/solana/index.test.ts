import type { ParsedTransactionWithMeta } from '@trezor/network-solana/types';

import { isValidTransaction } from './utils';

// Minimal object that satisfies every isValidTransaction check EXCEPT the signatures guard.
const baseValidTx = {
    meta: { fee: 0, err: null },
    blockTime: 1_700_000_000,
    slot: 1,
    transaction: {
        signatures: ['5xyz'],
        message: { recentBlockhash: 'abc', instructions: [] },
    },
} as unknown as ParsedTransactionWithMeta;

const withSignatures = (signatures: unknown) =>
    ({
        ...baseValidTx,
        transaction: { ...baseValidTx.transaction, signatures },
    }) as unknown as ParsedTransactionWithMeta;

describe('solana worker isValidTransaction', () => {
    it('accepts a transaction that has at least one signature', () => {
        expect(isValidTransaction(baseValidTx)).toBe(true);
    });

    it('rejects a transaction with an empty signatures array (untrusted RPC poison record)', () => {
        // An otherwise-valid tx (meta/transaction/blockTime present) but with `signatures: []` would
        // make transformTransaction/getDetails deref signatures[0] === undefined and throw
        // `Cannot read properties of undefined (reading 'toString')`, poisoning the whole page `.map`.
        expect(isValidTransaction(withSignatures([]))).toBe(false);
    });

    it('rejects a transaction with a missing signatures array', () => {
        expect(isValidTransaction(withSignatures(undefined))).toBe(false);
    });

    it('rejects transactions missing meta / transaction / blockTime (existing contract preserved)', () => {
        expect(
            isValidTransaction({ ...baseValidTx, meta: null } as ParsedTransactionWithMeta),
        ).toBe(false);
        expect(
            isValidTransaction({ ...baseValidTx, blockTime: null } as ParsedTransactionWithMeta),
        ).toBe(false);
    });
});
