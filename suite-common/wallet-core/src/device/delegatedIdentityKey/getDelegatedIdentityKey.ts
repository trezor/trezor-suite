import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorage } from '@suite-common/secure-storage';
import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { exhaustive } from '@trezor/type-utils';

import { deviceActions } from '../deviceActions';
import { selectPersistentDeviceData } from '../deviceSelectors';

export type GetCurrentDelegatedIdentityKeyDeps = {
    getState: () => any;
    secureStorage: SecureStorage;
    dispatch: Dispatch;
};

export type GetDelegatedIdentityKeyParams = {
    deviceId: string;
};

export type GetDelegatedIdentityKey = (
    params: GetDelegatedIdentityKeyParams,
) => Promise<DelegatedIdentityKey | null>;

export const createGetDelegatedIdentityKey =
    (deps: GetCurrentDelegatedIdentityKeyDeps): GetDelegatedIdentityKey =>
    async ({ deviceId }) => {
        const persistedData = selectPersistentDeviceData(deps.getState());
        const devicePersistedData = persistedData.find(it => it.device_id === deviceId);

        const encryptedCurrentDelegatedKey = devicePersistedData?.delegatedIdentityKey ?? null;

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
