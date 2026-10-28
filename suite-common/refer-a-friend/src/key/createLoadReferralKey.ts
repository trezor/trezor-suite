import { type Dispatch } from '@reduxjs/toolkit';

import { type EncryptedHex, type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { exhaustive } from '@trezor/type-utils';

import { type ReferralKeySessionCacheDep } from './createReferralKeySessionCache';
import { referAFriendActions } from '../referAFriendSlice';
import { type ReferralKey } from '../referralKey';

export type LoadReferralKeyDeps = {
    getEncryptedReferralKey: (deviceId: string) => EncryptedHex<ReferralKey> | null;
    dispatch: Dispatch;
} & PlatformEncryptionDep &
    ReferralKeySessionCacheDep;

export type LoadReferralKeyParams = {
    deviceId: string;
};

export type LoadReferralKey = (params: LoadReferralKeyParams) => Promise<ReferralKey | null>;

export type LoadReferralKeyDep = {
    loadReferralKey: LoadReferralKey;
};

export const createLoadReferralKey =
    (deps: LoadReferralKeyDeps): LoadReferralKey =>
    async ({ deviceId }) => {
        const cachedReferralKey = deps.referralKeySessionCache.get(deviceId);

        if (cachedReferralKey !== null) {
            return cachedReferralKey;
        }

        const encryptedReferralKey = deps.getEncryptedReferralKey(deviceId);

        if (encryptedReferralKey === null) {
            return null;
        }

        const result = await deps.platformEncryption.decrypt({ value: encryptedReferralKey });

        if (!result.success) {
            const errorType = result.error.type;
            switch (errorType) {
                // The stored key is unusable, purge it. The key has to be derived on the device again.
                case 'EncryptionUnavailable':
                case 'DecryptionFailed':
                    deps.dispatch(
                        referAFriendActions.setEncryptedReferralKey({
                            deviceId,
                            encryptedKey: null,
                        }),
                    );

                    return null;
                default:
                    return exhaustive(errorType);
            }
        }

        return result.payload;
    };
