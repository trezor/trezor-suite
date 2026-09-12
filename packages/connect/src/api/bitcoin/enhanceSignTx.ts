import type { BitcoinNetworkInfo, TransactionOptions } from '@trezor/connect-common';

import { findBackend } from '../../backend/BlockchainLink';

// Zcash version_group_id for NU5 (v5) transactions.
// https://github.com/zcash/zcash/blob/master/src/primitives/transaction.h
const ZCASH_NU5_VERSION_GROUP_ID = 0x26a7270a;

// Fallback consensus branch_id used only when the backend does not report one.
// Must track the currently active Zcash network upgrade or transactions will be
// rejected by the network and never confirm.
// NU6.2 (active since mainnet height 3364600): 0x5437f330.
// See https://zfnd.org/zebra-4-5-3-and-5-0-0-emergency-soft-fork-and-nu6-2-activation/
//
// NU6.3 (active since mainnet height 3428143): 0x37a5165b.
// See https://github.com/zcash/zips/blob/main/zips/zip-0258.md
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
                options.branch_id = ZCASH_FALLBACK_BRANCH_ID;
            }
        }
    }

    return options;
};
