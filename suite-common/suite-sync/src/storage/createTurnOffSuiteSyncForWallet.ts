import {
    type SubscriptionStorageDep,
    type SuiteSyncStorageRepositoryDep,
    type TurnOffSuiteSyncForWallet,
} from '@suite-common/suite-sync-types';

import { createStorageIdFromDeviceStaticSessionId } from './createStorageIdFromDeviceStaticSessionId';

export type CreateTurnOnSuiteSyncForWalletDeps = SuiteSyncStorageRepositoryDep &
    SubscriptionStorageDep;

export const createTurnOffSuiteSyncForWallet =
    (deps: CreateTurnOnSuiteSyncForWalletDeps): TurnOffSuiteSyncForWallet =>
    async ({ deviceStaticSessionId }) => {
        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);

        deps.subscriptionStorage.dispose(storageId);
        await deps.suiteSyncStorageRepository.delete(storageId);
    };
