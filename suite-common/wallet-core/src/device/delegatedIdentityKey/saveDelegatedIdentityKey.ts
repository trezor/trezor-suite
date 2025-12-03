import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorage } from '@suite-common/secure-storage';
import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { exhaustive } from '@trezor/type-utils';

import { deviceActions } from '../deviceActions';

export type SaveDelegatedIdentityKeyDeps = {
    secureStorage: SecureStorage;
    dispatch: Dispatch;
};

type SaveDelegatedIdentityKeyParms = {
    deviceId: string;
    delegatedIdentityKey: DelegatedIdentityKey;
};

export type SaveDelegatedIdentityKey = (params: SaveDelegatedIdentityKeyParms) => Promise<void>;

export const createSaveDelegatedIdentityKey =
    (deps: SaveDelegatedIdentityKeyDeps): SaveDelegatedIdentityKey =>
    async ({ deviceId, delegatedIdentityKey }) => {
        const result = await deps.secureStorage.encrypt({
            value: delegatedIdentityKey,
        });

        if (!result.ok) {
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
            deviceActions.setDelegatedIdentityKey({ deviceId, delegatedKey: result.value }),
        );

        return;
    };
