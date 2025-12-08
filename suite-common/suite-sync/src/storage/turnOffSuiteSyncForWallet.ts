import { SuiteSyncOwner } from '@suite-common/suite-types';

import { SubscriptionStorage } from './subscriptionStorage';
import { SuiteSyncStorageRepository } from '../SuiteSyncStorageRepository';

type CreateTurnOnSuiteSyncForWalletDeps = {
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
    subscriptionStorage: SubscriptionStorage;
};

export type TurnOffSuiteSyncForWallet = (params: {
    owner: SuiteSyncOwner | undefined;
}) => Promise<void>;

export type TurnOffSuiteSyncForWalletDep = {
    turnOffSuiteSyncForWallet: TurnOffSuiteSyncForWallet;
};

export const createTurnOffSuiteSyncForWallet =
    (deps: CreateTurnOnSuiteSyncForWalletDeps): TurnOffSuiteSyncForWallet =>
    async ({ owner }) => {
        if (owner === undefined) {
            return;
        }

        deps.subscriptionStorage.disposeAll(owner.ownerId);
        await deps.suiteSyncStorageRepository.delete(owner.ownerId);
    };
