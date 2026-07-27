import { type Dispatch } from '@reduxjs/toolkit';

import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type SuiteSyncOwner, serializeSuiteSyncOwner } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { setSuiteSyncOwner } from '../suiteSyncSlice';

export type SaveSuiteSyncOwnerDeps = {
    dispatch: Dispatch;
} & PlatformEncryptionDep;

type SaveSuiteSyncOwnerParams = {
    deviceStaticId: StaticSessionId;
    suiteSyncOwner: SuiteSyncOwner;
};

export type SaveSuiteSyncOwner = (params: SaveSuiteSyncOwnerParams) => Promise<void>;

export type SaveSuiteSyncOwnerDep = {
    saveSuiteSyncOwner: SaveSuiteSyncOwner;
};

export const createSaveSuiteSyncOwner =
    (deps: SaveSuiteSyncOwnerDeps): SaveSuiteSyncOwner =>
    async ({ deviceStaticId, suiteSyncOwner }) => {
        const result = await deps.platformEncryption.encrypt({
            value: serializeSuiteSyncOwner(suiteSyncOwner),
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
                    deps.dispatch(setSuiteSyncOwner({ deviceStaticId, owner: null }));

                    return;
                }

                default:
                    return exhaustive(result.error.type);
            }
        }

        deps.dispatch(setSuiteSyncOwner({ deviceStaticId, owner: result.payload }));

        return;
    };
