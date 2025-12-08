import {
    CreateTurnOnSuiteSyncForWalletDeps,
    TurnOffSuiteSyncForWallet,
} from '@suite-common/suite-sync-types';

export const createTurnOffSuiteSyncForWallet =
    (deps: CreateTurnOnSuiteSyncForWalletDeps): TurnOffSuiteSyncForWallet =>
    async ({ owner }) => {
        if (owner === undefined) {
            return;
        }

        deps.subscriptionStorage.disposeAll(owner.ownerId);
        await deps.suiteSyncStorageRepository.delete(owner.ownerId);
    };
