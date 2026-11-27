import { type Dispatch } from '@reduxjs/toolkit';

import { type EncryptedHex, type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type WalletDescriptor } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { type ReferralKeySessionCacheDep } from './createReferralKeySessionCache';
import { referAFriendActions } from '../referAFriendSlice';
import { type ReferralKey } from '../referralKey';

export type LoadReferralKeyDeps = {
    getEncryptedReferralKey: (
        walletDescriptor: WalletDescriptor,
    ) => EncryptedHex<ReferralKey> | null;
    dispatch: Dispatch;
} & PlatformEncryptionDep &
    ReferralKeySessionCacheDep;

export type LoadReferralKeyParams = {
    walletDescriptor: WalletDescriptor;
};

export type LoadReferralKey = (params: LoadReferralKeyParams) => Promise<ReferralKey | null>;

export type LoadReferralKeyDep = {
    loadReferralKey: LoadReferralKey;
};

export const createLoadReferralKey =
    (deps: LoadReferralKeyDeps): LoadReferralKey =>
    async ({ walletDescriptor }) => {
        const cachedReferralKey = deps.referralKeySessionCache.get(walletDescriptor);

        if (cachedReferralKey !== null) {
            return cachedReferralKey;
        }

        const encryptedReferralKey = deps.getEncryptedReferralKey(walletDescriptor);

        if (encryptedReferralKey === null) {
            return null;
        }

        const result = await deps.platformEncryption.decrypt({ value: encryptedReferralKey });

        if (!result.success) {
            const errorType = result.error.type;

            // The stored key is unusable, purge it. The key has to be derived on the device again.
            const purgeStoredKey = () => {
                deps.dispatch(
                    referAFriendActions.setEncryptedReferralKey({
                        walletDescriptor,
                        encryptedKey: null,
                    }),
                );
            };

            switch (errorType) {
                case 'DecryptionFailed':
                    console.error('Referral key: decrypting the stored key failed, purging it');
                    purgeStoredKey();

                    return null;
                case 'EncryptionUnavailable':
                    purgeStoredKey();

                    return null;
                default:
                    return exhaustive(errorType);
            }
        }

        return result.payload;
    };
