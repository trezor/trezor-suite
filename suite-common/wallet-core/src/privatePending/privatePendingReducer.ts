import { createReducer } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';

import { privatePendingActions } from './privatePendingActions';

// A private in-flight tx must never be declared forever: if the relay drops it and it never mines,
// confirmedNonce never advances past its nonce, so this TTL is the backstop that stops declaring a
// nonce that will never confirm (bounds the trezor/blockbook#1629 over-declaration window). Kept a
// little above the send flow's fake-pending-tx TTL (~15 min) so a slow relay inclusion is not
// dropped prematurely (which would re-open under-declaration).
export const PRIVATE_PENDING_TTL_MS = 20 * 60 * 1000;

export interface PrivatePendingEntry {
    nonce: number;
    txid: string;
    submittedAt: number;
}

// Keyed by account.key (a template-literal type, hence the string index). Only genuinely-private
// (MEV-protected) in-flight txs are recorded here; this slice is the sole source of truth for the
// privatePending hint - deliberately NOT derived from the tx list, which cannot represent the
// private/public bit and misses the staking / walletconnect / claim flows that leave no tx-list
// artifact.
export type PrivatePendingState = {
    [accountKey: string]: PrivatePendingEntry[];
};

export type PrivatePendingRootState = {
    wallet: { privatePending: PrivatePendingState };
};

export const privatePendingInitialState: PrivatePendingState = {};

export const privatePendingReducer = createReducer(privatePendingInitialState, builder => {
    builder
        .addCase(privatePendingActions.privatePendingAdded, (state, { payload }) => {
            const { accountKey, nonce, txid, submittedAt } = payload;
            if (!state[accountKey]) {
                state[accountKey] = [];
            }
            const existing = state[accountKey].find(entry => entry.nonce === nonce);
            if (existing) {
                existing.txid = txid;
                existing.submittedAt = submittedAt;
            } else {
                state[accountKey].push({ nonce, txid, submittedAt });
            }
        })
        .addCase(privatePendingActions.privatePendingPruned, (state, { payload }) => {
            const { accountKey, confirmedNonce, now } = payload;
            const entries = state[accountKey];
            if (!entries) return;
            const kept = entries.filter(
                entry =>
                    entry.nonce >= confirmedNonce &&
                    now - entry.submittedAt < PRIVATE_PENDING_TTL_MS,
            );
            if (kept.length > 0) {
                state[accountKey] = kept;
            } else {
                delete state[accountKey];
            }
        })
        .addCase(privatePendingActions.privatePendingAccountRemoved, (state, { payload }) => {
            delete state[payload.accountKey];
        });
});

const selectAccountPrivatePendingEntries = (
    state: PrivatePendingRootState,
    accountKey: AccountKey,
    // Optional chaining tolerates a partial store that omits this slice (e.g. hook unit tests with a
    // hand-built mock state); the real store always initializes it via combineReducers.
): PrivatePendingEntry[] | undefined => state.wallet.privatePending?.[accountKey];

// The unpruned private nonces for this account, ascending. The routing/floor source for both hint
// sites. Deliberately independent of the tx list so the no-fake-tx flows stay covered.
export const selectAccountPrivatePendingNonces = (
    state: PrivatePendingRootState,
    accountKey: AccountKey,
): number[] => {
    const entries = selectAccountPrivatePendingEntries(state, accountKey);

    return entries ? entries.map(entry => entry.nonce).sort((a, b) => a - b) : [];
};

// The getAccountInfo hint object, or undefined when nothing is in flight (a safe no-op, like
// confirmedNonce's default). Returning undefined for the empty case is also what gates the extra
// confirmedNonce round-trip and the relay routing off for accounts with no private tx in flight.
export const selectAccountPrivatePendingHint = (
    state: PrivatePendingRootState,
    accountKey: AccountKey,
): { nonces: number[]; txids: string[] } | undefined => {
    const entries = selectAccountPrivatePendingEntries(state, accountKey);
    if (!entries || entries.length === 0) return undefined;
    const sorted = [...entries].sort((a, b) => a.nonce - b.nonce);

    return {
        nonces: sorted.map(entry => entry.nonce),
        txids: sorted.map(entry => entry.txid),
    };
};
