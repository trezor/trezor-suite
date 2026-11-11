import type { BitcoinNetworkInfo, TransactionOptions } from '@trezor/connect-common';

// Zcash version_group_id for NU5 (v5) transactions.
// https://github.com/zcash/zcash/blob/master/src/primitives/transaction.h
const ZCASH_NU5_VERSION_GROUP_ID = 0x26a7270a;

// Consensus branch_id used only when the caller doesn't provide one.
// It must track the currently active Zcash network upgrade: signing with a stale value
// produces a transaction the network rejects and never confirms. Because this constant
// only reaches users through the (slow) release train, callers should pass the backend value
// (`consensusBranchId` of `blockchainGetInfo`) as `branchId`, as Suite does, and this is
// a last resort.
// NU7 (active since mainnet height 3543405, testnet height 4465026): 0x77190ad9.
// https://zips.z.cash/zip-0259
const ZCASH_FALLBACK_BRANCH_ID = 0x77190ad9;

// Fills in Zcash transaction fields the caller did not provide. Options of any other coin
// are returned unchanged.
export const applyZcashSignTxDefaultsIfZcash = (
    options: TransactionOptions,
    coinInfo: BitcoinNetworkInfo,
): TransactionOptions => {
    if (coinInfo.shortcut !== 'ZEC' && coinInfo.shortcut !== 'TAZ') {
        return options;
    }

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
    // use branch_id passed by the caller or fallback to default
    if (typeof options.branch_id !== 'number') {
        console.warn(
            `Zcash: no branchId passed, using hardcoded fallback 0x${ZCASH_FALLBACK_BRANCH_ID.toString(16)}. If the network has upgraded since this release, the transaction may be rejected; pass consensusBranchId of blockchainGetInfo as branchId to override.`,
        );
        options.branch_id = ZCASH_FALLBACK_BRANCH_ID;
    }

    return options;
};
