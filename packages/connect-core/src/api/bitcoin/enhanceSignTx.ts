import type { BitcoinNetworkInfo, TransactionOptions } from '@trezor/connect-common';

import { findBackend } from '../../backend/BlockchainLink';

// Zcash version_group_id for NU5 (v5) transactions.
// https://github.com/zcash/zcash/blob/master/src/primitives/transaction.h
const ZCASH_NU5_VERSION_GROUP_ID = 0x26a7270a;

// Consensus branch_id used only when neither the caller nor the backend provides one.
// It must track the currently active Zcash network upgrade: signing with a stale value
// produces a transaction the network rejects and never confirms. Because this constant
// only reaches users through the (slow) release train, the backend value
// (Blockbook `backend.consensus.chaintip`) is the preferred source and this is a last
// resort — offline signers should pass an explicit `branchId` instead.
// NU6.3 (active since mainnet height 3428143, 2026-07-28): 0x37a5165b.
// https://zips.z.cash/zip-0258
const ZCASH_FALLBACK_BRANCH_ID = 0x37a5165b;

// enhance TransactionOptions with default values if they are not provided
// in case of network upgrade/fork those values should be updated as well
export const enhanceSignTx = (
    options: TransactionOptions,
    coinInfo: BitcoinNetworkInfo,
): TransactionOptions => {
    // zcash, zcash testnet
    if (coinInfo.shortcut === 'ZEC' || coinInfo.shortcut === 'TAZ') {
        // use overwintered tx
        if (typeof options.overwintered !== 'boolean') {
            options.overwintered = true;
        }
        // use NU5 version and version_group_id
        if (typeof options.version !== 'number') {
            options.version = 5;
        }
        if (typeof options.version_group_id !== 'number') {
            options.version_group_id = ZCASH_NU5_VERSION_GROUP_ID;
        }
        // use branch_id from backend or fallback to default
        if (typeof options.branch_id !== 'number') {
            const backend = findBackend(coinInfo.shortcut);
            if (backend?.serverInfo?.consensusBranchId) {
                options.branch_id = backend.serverInfo.consensusBranchId;
            } else {
                console.warn(
                    `Zcash: backend did not report a consensus branch_id, using hardcoded fallback 0x${ZCASH_FALLBACK_BRANCH_ID.toString(16)}. If the network has upgraded since this release, the transaction may be rejected; pass an explicit branchId to override.`,
                );
                options.branch_id = ZCASH_FALLBACK_BRANCH_ID;
            }
        }
    }

    return options;
};
