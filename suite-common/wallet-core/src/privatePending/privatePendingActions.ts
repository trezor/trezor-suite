import { createAction } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';

export const PRIVATE_PENDING_MODULE_PREFIX = '@common/wallet-core/privatePending';

// Record a genuinely-private (MEV-protected / relay-routed) in-flight tx at broadcast time. Upsert by
// nonce so a speed-up/cancel at the same nonce rewrites the txid rather than orphaning the entry.
const privatePendingAdded = createAction(
    `${PRIVATE_PENDING_MODULE_PREFIX}/added`,
    (payload: { accountKey: AccountKey; nonce: number; txid: string }) => ({
        payload: { ...payload, submittedAt: Date.now() },
    }),
);

// STOP condition: drop entries for one account that are now mined (nonce < confirmedNonce) or older
// than the TTL backstop. Dispatched on every basic getAccountInfo response so it self-heals across
// load-balanced blockbook instances (confirmedNonce is instance-agnostic). now is stamped here to
// keep the reducer pure.
const privatePendingPruned = createAction(
    `${PRIVATE_PENDING_MODULE_PREFIX}/pruned`,
    (payload: { accountKey: AccountKey; confirmedNonce: number }) => ({
        payload: { ...payload, now: Date.now() },
    }),
);

const privatePendingAccountRemoved = createAction(
    `${PRIVATE_PENDING_MODULE_PREFIX}/accountRemoved`,
    (payload: { accountKey: AccountKey }) => ({ payload }),
);

export const privatePendingActions = {
    privatePendingAdded,
    privatePendingPruned,
    privatePendingAccountRemoved,
};
