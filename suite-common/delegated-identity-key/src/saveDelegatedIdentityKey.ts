import { type Dispatch } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { exhaustive } from '@trezor/type-utils';

export type SaveDelegatedIdentityKeyDeps = {
    dispatch: Dispatch;
} & PlatformEncryptionDep;

type SaveDelegatedIdentityKeyParms = {
    deviceId: string;
    delegatedIdentityKey: DelegatedIdentityKey;
};

export type SaveDelegatedIdentityKey = (params: SaveDelegatedIdentityKeyParms) => Promise<void>;

export type SaveDelegatedIdentityKeyDep = {
    saveDelegatedIdentityKey: SaveDelegatedIdentityKey;
};

export const createSaveDelegatedIdentityKey =
    (deps: SaveDelegatedIdentityKeyDeps): SaveDelegatedIdentityKey =>
    async ({ deviceId, delegatedIdentityKey }) => {
        const result = await deps.platformEncryption.encrypt({
            value: delegatedIdentityKey,
        });

        if (!result.success) {
            switch (result.error.type) {
                /**
                 * If encryption is not available we are not storing it.
                 * Therefore, we can silently pass null.
                 *
                 * Same for `DecryptionFailed`. We purge the storage
                 * and silently pass null, erasing data.
                 *
                 * User is therefore required to have device connected.
                 */
                case 'EncryptionUnavailable': {
                    deps.dispatch(
                        deviceActions.setDelegatedIdentityKey({ deviceId, delegatedKey: null }),
                    );

                    return;
                }

                default:
                    return exhaustive(result.error.type);
            }
        }

        deps.dispatch(
            deviceActions.setDelegatedIdentityKey({ deviceId, delegatedKey: result.payload }),
        );

        return;
    };
