import { type Dispatch } from '@reduxjs/toolkit';

import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type WalletDescriptor } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { type ReferralKeySessionCacheDep } from './createReferralKeySessionCache';
import { referAFriendActions } from '../referAFriendSlice';
import { type ReferralKey } from '../referralKey';

export type SaveReferralKeyDeps = {
    dispatch: Dispatch;
} & PlatformEncryptionDep &
    ReferralKeySessionCacheDep;

export type SaveReferralKeyParams = {
    walletDescriptor: WalletDescriptor;
    referralKey: ReferralKey;
};

export type SaveReferralKey = (params: SaveReferralKeyParams) => Promise<void>;

export type SaveReferralKeyDep = {
    saveReferralKey: SaveReferralKey;
};

export const createSaveReferralKey =
    (deps: SaveReferralKeyDeps): SaveReferralKey =>
    async ({ walletDescriptor, referralKey }) => {
        const result = await deps.platformEncryption.encrypt({ value: referralKey });

        if (!result.success) {
            const errorType = result.error.type;
            switch (errorType) {
                // Without secure persistence, keep the key only for this session.
                case 'EncryptionUnavailable':
                    deps.referralKeySessionCache.set(walletDescriptor, referralKey);
                    deps.dispatch(
                        referAFriendActions.setEncryptedReferralKey({
                            walletDescriptor,
                            encryptedKey: null,
                        }),
                    );

                    return;
                default:
                    return exhaustive(errorType);
            }
        }

        deps.dispatch(
            referAFriendActions.setEncryptedReferralKey({
                walletDescriptor,
                encryptedKey: result.payload,
            }),
        );
    };
