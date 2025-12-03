import { Dispatch } from '@reduxjs/toolkit';

import { EncryptedHex, SecureStorageDep } from '@suite-common/secure-storage';
import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { exhaustive } from '@trezor/type-utils';

import { deviceActions } from '../deviceActions';

export type LoadDelegatedIdentityKeyFromStateDeps = {
    getDeviceDelegatedIdentityKey: (deviceId: string) => EncryptedHex<DelegatedIdentityKey> | null;
    dispatch: Dispatch;
} & SecureStorageDep;

export type LoadDelegatedIdentityKeyFromStateParams = {
    deviceId: string;
};

export type LoadDelegatedIdentityKeyFromStateDep = {
    loadDelegatedIdentityKeyFromState: LoadDelegatedIdentityKeyFromState;
};

export type LoadDelegatedIdentityKeyFromState = (
    params: LoadDelegatedIdentityKeyFromStateParams,
) => Promise<DelegatedIdentityKey | null>;

export const createLoadDelegatedIdentityKeyFromState =
    (deps: LoadDelegatedIdentityKeyFromStateDeps): LoadDelegatedIdentityKeyFromState =>
    async ({ deviceId }) => {
        const encryptedCurrentDelegatedKey = deps.getDeviceDelegatedIdentityKey(deviceId);

        if (encryptedCurrentDelegatedKey === null) {
            return null;
        }

        const result = await deps.secureStorage.decrypt({
            value: encryptedCurrentDelegatedKey,
        });

        if (!result.ok) {
            const errorType = result.error.type;
            switch (errorType) {
                /**
                 * If encryption is not available we are not storing it.
                 * Therefore, we can silently pass null.
                 *
                 * Same for `DecryptionFailed`. We purge the storage
                 * and silently pass null, erasing data.
                 *
                 * User is therefore required to have device connected.
                 */
                case 'EncryptionUnavailable':
                case 'DecryptionFailed': {
                    deps.dispatch(
                        deviceActions.setDelegatedIdentityKey({ deviceId, delegatedKey: null }),
                    );

                    return null;
                }
                default:
                    return exhaustive(errorType);
            }
        }

        return result.value;
    };
