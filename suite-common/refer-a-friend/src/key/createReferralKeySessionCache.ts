import { type WalletDescriptor } from '@trezor/device-utils';

import { type ReferralKey } from '../referralKey';

/**
 * In-memory fallback for platforms without secure persistence (web, Linux without a keyring).
 * The key is then derived once per session instead of on every page visit.
 */
export type ReferralKeySessionCache = {
    get: (walletDescriptor: WalletDescriptor) => ReferralKey | null;
    set: (walletDescriptor: WalletDescriptor, referralKey: ReferralKey) => void;
    remove: (walletDescriptor: WalletDescriptor) => void;
};

export type ReferralKeySessionCacheDep = {
    referralKeySessionCache: ReferralKeySessionCache;
};

export const createReferralKeySessionCache = (): ReferralKeySessionCache => {
    const referralKeys = new Map<WalletDescriptor, ReferralKey>();

    return {
        get: walletDescriptor => referralKeys.get(walletDescriptor) ?? null,
        set: (walletDescriptor, referralKey) => {
            referralKeys.set(walletDescriptor, referralKey);
        },
        remove: walletDescriptor => {
            referralKeys.delete(walletDescriptor);
        },
    };
};
