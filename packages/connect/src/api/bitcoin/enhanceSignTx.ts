import { findBackend } from '../../backend/BlockchainLink';
import type { BitcoinNetworkInfo } from '../../types';
import type { TransactionOptions } from '../../types/api/bitcoin';

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
            options.version_group_id = 0x26a7270a;
        }
        // use branch_id from backend or fallback to default
        if (typeof options.branch_id !== 'number') {
            const backend = findBackend(coinInfo.name);
            if (backend && backend.serverInfo?.consensusBranchId) {
                options.branch_id = backend.serverInfo.consensusBranchId;
            } else {
                options.branch_id = 0xc2d6d0b4;
            }
        }
    }
    // komodo
    if (coinInfo.shortcut === 'KMD') {
        if (typeof options.overwintered !== 'boolean') {
            options.overwintered = true;
        }
        if (typeof options.version !== 'number') {
            options.version = 4;
        }
        if (typeof options.version_group_id !== 'number') {
            options.version_group_id = 0x892f2085;
        }
        if (typeof options.branch_id !== 'number') {
            options.branch_id = 0x76b809bb;
        }
    }
    // koto
    if (coinInfo.shortcut === 'KOTO') {
        if (typeof options.overwintered !== 'boolean') {
            options.overwintered = true;
        }
        if (typeof options.version !== 'number') {
            options.version = 4;
        }
        if (typeof options.version_group_id !== 'number') {
            options.version_group_id = 0x892f2085;
        }
        if (typeof options.branch_id !== 'number') {
            options.branch_id = 0x2bb40e60;
        }
    }
    // peercoin
    if (coinInfo.shortcut === 'PPC' || coinInfo.shortcut === 'tPPC') {
        if (typeof options.timestamp !== 'number') {
            options.timestamp = Math.round(new Date().getTime() / 1000);
        }
    }

    return options;
};
