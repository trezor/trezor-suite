import { type ReferralKey } from '../referralKey';

/**
 * In-memory fallback for platforms without secure persistence (web, Linux without a keyring).
 * The key is then derived once per session instead of on every page visit.
 */
export type ReferralKeySessionCache = {
    get: (deviceId: string) => ReferralKey | null;
    set: (deviceId: string, referralKey: ReferralKey) => void;
    remove: (deviceId: string) => void;
};

export type ReferralKeySessionCacheDep = {
    referralKeySessionCache: ReferralKeySessionCache;
};

export const createReferralKeySessionCache = (): ReferralKeySessionCache => {
    const referralKeys = new Map<string, ReferralKey>();

    return {
        get: deviceId => referralKeys.get(deviceId) ?? null,
        set: (deviceId, referralKey) => {
            referralKeys.set(deviceId, referralKey);
        },
        remove: deviceId => {
            referralKeys.delete(deviceId);
        },
    };
};
