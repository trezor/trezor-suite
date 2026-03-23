import { type Dispatch } from '@reduxjs/toolkit';

import { type EncryptedHex, type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    type SuiteSyncOwner,
    type SuiteSyncOwnerSerialized,
    deserializeSuiteSyncOwner,
} from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { setSuiteSyncOwner } from '../suiteSyncSlice';

export type LoadSuiteSyncOwnerFromStateDeps = {
    getDeviceSuiteSyncOwner: (
        deviceStaticId: StaticSessionId,
    ) => EncryptedHex<SuiteSyncOwnerSerialized> | null;
    dispatch: Dispatch;
} & PlatformEncryptionDep;

export type LoadSuiteSyncOwnerFromStateParams = {
    deviceStaticId: StaticSessionId;
};

export type LoadSuiteSyncOwnerFromStateDep = {
    loadSuiteSyncOwnerFromState: LoadSuiteSyncOwnerFromState;
};

export type LoadSuiteSyncOwnerFromState = (
    params: LoadSuiteSyncOwnerFromStateParams,
) => Promise<SuiteSyncOwner | null>;

export const createLoadSuiteSyncOwnerFromState =
    (deps: LoadSuiteSyncOwnerFromStateDeps): LoadSuiteSyncOwnerFromState =>
    async ({ deviceStaticId }) => {
        const encryptedSuiteSyncOwner = deps.getDeviceSuiteSyncOwner(deviceStaticId);

        if (encryptedSuiteSyncOwner === null) {
            return null;
        }

        const result = await deps.platformEncryption.decrypt({
            value: encryptedSuiteSyncOwner,
        });

        if (!result.success) {
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
                    deps.dispatch(setSuiteSyncOwner({ deviceStaticId, owner: null }));

                    return null;
                }
                default:
                    return exhaustive(errorType);
            }
        }

        return deserializeSuiteSyncOwner(result.payload);
    };
