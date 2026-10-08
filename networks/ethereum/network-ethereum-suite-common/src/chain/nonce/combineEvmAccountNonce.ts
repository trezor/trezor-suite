import type { ChainAccountNonce } from '@trezor/network-module-suite-common-types';

/** An account's nonce as its backend counts it. */
export type EvmNonceReading = {
    /** Transactions the backend knows, mined or waiting in its mempool. */
    readonly pendingNonce: number;

    /** Mined transactions only; `undefined` where the backend cannot tell (older Blockbook). */
    readonly confirmedNonce?: number;
};

// Far more than a node keeps pending per sender; bounds the list against a node's bogus count.
const MAX_LISTED_PENDING_NONCES = 1024;

const getLowest = (nonces: ReadonlySet<number>) =>
    nonces.size > 0 ? Math.min(...nonces) : Number.POSITIVE_INFINITY;

/**
 * The account's nonce from its backend's count and the wallet's own pending sends, which the
 * backend may not see yet (private relays, lag).
 *
 * Every nonce below the backend's pending count is taken, also by transactions sent from
 * elsewhere; the next nonce then walks past own pending sends and stops at the first gap, so a
 * stuck send cannot inflate it. Without a mined-only count, the confirmed nonce is the backend's
 * pending count, lowered to the lowest own pending send: a pending send proves its nonce is not
 * mined yet.
 */
export const combineEvmAccountNonce = (
    reading: EvmNonceReading,
    ownPendingNonces: readonly number[],
): ChainAccountNonce => {
    const ownPending = new Set(ownPendingNonces);
    const confirmedNonce =
        reading.confirmedNonce ?? Math.min(reading.pendingNonce, getLowest(ownPending));

    let nextNonce = Math.max(confirmedNonce, reading.pendingNonce);
    while (ownPending.has(nextNonce)) nextNonce += 1;

    // Every pending transaction of an address is the account's own, so the whole range up to the
    // next nonce is pending; own sends above it wait behind a gap.
    const pendingNonces = new Set<number>();
    const listedUntil = Math.min(nextNonce, confirmedNonce + MAX_LISTED_PENDING_NONCES);
    for (let nonce = confirmedNonce; nonce < listedUntil; nonce += 1) pendingNonces.add(nonce);
    ownPending.forEach(nonce => {
        if (nonce >= confirmedNonce) pendingNonces.add(nonce);
    });

    return {
        confirmedNonce,
        nextNonce,
        pendingNonces: [...pendingNonces].sort((a, b) => a - b),
    };
};
