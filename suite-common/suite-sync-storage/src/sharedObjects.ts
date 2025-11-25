import { SuiteSyncOwner } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncStorageRepository } from './SuiteSyncStorageRepository';

type SubscriptionKey = 'labeling'; // for example: "labeling", ...

export const subscriptionStorage: Record<
    WalletDescriptor,
    Partial<Record<SubscriptionKey, () => void>>
> = {};

export let suiteSyncStorages: SuiteSyncStorageRepository | null = null;

export const setSuiteSyncProvider = (repository: SuiteSyncStorageRepository) => {
    suiteSyncStorages = repository;
};

export const getSuiteSyncStorageProvider = (owner: SuiteSyncOwner) => {
    if (suiteSyncStorages === null) {
        console.error('initSuiteSync[Desktop|Native]() must be called before this!'); // IMPORTANT! Throw Error can be suppressed in thunks :(
        throw Error('initSuiteSync[Desktop|Native]() must be called before this!');
    }

    return suiteSyncStorages.get(owner);
};
