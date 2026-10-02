import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { NonceFailure, NonceVerifierInfo, VerifiedNonce } from '@suite/desktop-app-api';
import { type AccountKey } from '@suite-common/wallet-types';

// Session-local observations only: nothing here is persisted, and a verified envelope loses its
// "current" status once its authenticated block leaves the freshness window (see the selectors).
export type VerifiedNonceEntry =
    | { status: 'running'; requestId: string; lastVerified: VerifiedNonce | null }
    | { status: 'verified'; requestId: string; result: VerifiedNonce }
    | {
          status: 'failed';
          requestId: string;
          failure: NonceFailure;
          lastVerified: VerifiedNonce | null;
      };

export type VerifiedNonceState = {
    entries: Partial<Record<AccountKey, VerifiedNonceEntry>>;
    info: NonceVerifierInfo | null;
};

export type VerifiedNonceRootState = {
    verifiedNonce: VerifiedNonceState;
};

const initialState: VerifiedNonceState = { entries: {}, info: null };

const lastVerifiedOf = (entry: VerifiedNonceEntry | undefined): VerifiedNonce | null => {
    if (!entry) return null;

    return entry.status === 'verified' ? entry.result : entry.lastVerified;
};

const verifiedNonceSlice = createSlice({
    name: 'verifiedNonce',
    initialState,
    reducers: {
        setInfo(state: VerifiedNonceState, action: PayloadAction<NonceVerifierInfo>) {
            state.info = action.payload;
        },
        verificationStarted(
            state: VerifiedNonceState,
            action: PayloadAction<{ accountKey: AccountKey; requestId: string }>,
        ) {
            const { accountKey, requestId } = action.payload;
            state.entries[accountKey] = {
                status: 'running',
                requestId,
                lastVerified: lastVerifiedOf(state.entries[accountKey]),
            };
        },
        verificationFinished(
            state: VerifiedNonceState,
            action: PayloadAction<{
                accountKey: AccountKey;
                requestId: string;
                result: VerifiedNonce | NonceFailure;
            }>,
        ) {
            const { accountKey, requestId, result } = action.payload;
            const entry = state.entries[accountKey];
            // A reply for a request that is no longer the current one (cancelled, superseded, or
            // the account was switched and re-verified) must not populate anything.
            if (entry?.status !== 'running' || entry.requestId !== requestId) return;
            state.entries[accountKey] =
                result.status === 'verified'
                    ? { status: 'verified', requestId, result }
                    : {
                          status: 'failed',
                          requestId,
                          failure: result,
                          lastVerified: entry.lastVerified,
                      };
        },
    },
});

export const verifiedNonceActions = verifiedNonceSlice.actions;
export const verifiedNonceReducer = verifiedNonceSlice.reducer;

export const selectVerifiedNonceInfo = (state: VerifiedNonceRootState) => state.verifiedNonce.info;

export const selectVerifiedNonceEntry = (state: VerifiedNonceRootState, accountKey: AccountKey) =>
    state.verifiedNonce.entries[accountKey] ?? null;

// The age window is measured against the authenticated timestamp, never against when the entry
// was last read, so re-rendering can only make a result stale, never fresh again.
export const isVerifiedNonceCurrent = (result: VerifiedNonce, nowMs: number) =>
    nowMs < result.expiresAtMs;
