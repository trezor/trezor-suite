import { type Dispatch } from '@reduxjs/toolkit';

import {
    type SubscriptionStorageDep,
    type SuiteSyncStorageRepositoryDep,
    type TurnOffSuiteSyncForWallet,
} from '@suite-common/suite-sync-types';

import { createStorageIdFromDeviceStaticSessionId } from './createStorageIdFromDeviceStaticSessionId';
import { setSuiteSyncOwner } from '../suiteSyncSlice';

export type TurnOffSuiteSyncForWalletDeps = SuiteSyncStorageRepositoryDep &
    SubscriptionStorageDep & { dispatch: Dispatch };

export const createTurnOffSuiteSyncForWallet =
    (deps: TurnOffSuiteSyncForWalletDeps): TurnOffSuiteSyncForWallet =>
    async ({ deviceStaticSessionId }) => {
        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);

        try {
            deps.subscriptionStorage.dispose(storageId);
            await deps.suiteSyncStorageRepository.delete(storageId);
        } finally {
            // Defensively always delete keys
            deps.dispatch(
                setSuiteSyncOwner({ deviceStaticId: deviceStaticSessionId, owner: null }),
            );
        }
    };
