import type { ParsedTransactionWithMeta } from '@trezor/network-solana/types';

import { isValidTransaction } from './utils';

// Minimal object that satisfies every isValidTransaction check. It mirrors the fields that
// solanaUtils.transformTransaction / getDetails dereference unconditionally while mapping a page of
// account history: signatures[0], message.accountKeys/instructions, meta.preBalances/postBalances/fee.
const baseValidTx = {
    meta: { fee: 0, err: null, preBalances: [0], postBalances: [0] },
    blockTime: 1_700_000_000,
    slot: 1,
    transaction: {
        signatures: ['5xyz'],
        message: { recentBlockhash: 'abc', instructions: [], accountKeys: [] },
    },
} as unknown as ParsedTransactionWithMeta;

const withSignatures = (signatures: unknown) =>
    ({
        ...baseValidTx,
        transaction: { ...baseValidTx.transaction, signatures },
    }) as unknown as ParsedTransactionWithMeta;

const withMessage = (message: unknown) =>
    ({
        ...baseValidTx,
        transaction: { ...baseValidTx.transaction, message },
    }) as unknown as ParsedTransactionWithMeta;

const withMeta = (meta: unknown) =>
    ({ ...baseValidTx, meta }) as unknown as ParsedTransactionWithMeta;

describe('solana worker isValidTransaction', () => {
    it('accepts a fully-formed transaction', () => {
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

    it('rejects a transaction whose message omits accountKeys', () => {
        // getNativeEffects derefs `transaction.message.accountKeys.map(...)` (reached first), so a
        // meta-present tx whose message lacks accountKeys would crash the whole page.
        expect(isValidTransaction(withMessage({ instructions: [] }))).toBe(false);
    });

    it('rejects a transaction whose message omits instructions', () => {
        // getTxType derefs `transaction.message.instructions.some(...)`.
        expect(isValidTransaction(withMessage({ accountKeys: [] }))).toBe(false);
    });

    it('rejects a transaction with a missing message', () => {
        expect(isValidTransaction(withMessage(undefined))).toBe(false);
    });

    it('rejects a transaction whose meta omits preBalances / postBalances', () => {
        // extractAccountBalanceDiff derefs `meta.preBalances[i]` / `meta.postBalances[i]`.
        expect(isValidTransaction(withMeta({ fee: 0, err: null, postBalances: [0] }))).toBe(false);
        expect(isValidTransaction(withMeta({ fee: 0, err: null, preBalances: [0] }))).toBe(false);
    });

    it('rejects a transaction whose meta omits fee', () => {
        // getNativeTransferTxType derefs `meta.fee.toString()`.
        expect(
            isValidTransaction(withMeta({ err: null, preBalances: [0], postBalances: [0] })),
        ).toBe(false);
    });

    it('rejects transactions missing meta / transaction / blockTime (existing contract preserved)', () => {
        expect(isValidTransaction(withMeta(null))).toBe(false);
        expect(
            isValidTransaction({ ...baseValidTx, blockTime: null } as ParsedTransactionWithMeta),
        ).toBe(false);
    });
});
