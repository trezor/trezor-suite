import { SuiteSyncOwner } from '@suite-common/suite-types';

import { SubscriptionStorage } from './subscriptionStorage';
import { SuiteSyncStorageRepository } from '../SuiteSyncStorageRepository';

export type CreateTurnOnSuiteSyncForWalletDeps = {
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
    subscriptionStorage: SubscriptionStorage;
};

export type TurnOffSuiteSyncForWallet = (params: {
    owner: SuiteSyncOwner | undefined;
}) => Promise<void>;

export type TurnOffSuiteSyncForWalletDep = {
    turnOffSuiteSyncForWallet: TurnOffSuiteSyncForWallet;
};
