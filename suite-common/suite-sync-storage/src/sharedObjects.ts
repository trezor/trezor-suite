import { SuiteSyncOwner } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncStorageProvider } from './SuiteSyncStorageProvider';

type SubscriptionKey = 'labeling'; // for example: "labeling", ...

export const subscriptionStorage: Record<
    WalletDescriptor,
    Partial<Record<SubscriptionKey, () => void>>
> = {};

export let suiteSyncStorageProvider: SuiteSyncStorageProvider | null = null;

export const setSuiteSyncProvider = (provider: SuiteSyncStorageProvider) => {
    suiteSyncStorageProvider = provider;
};

export const getSuiteSyncStorageProvider = (owner: SuiteSyncOwner) => {
    if (suiteSyncStorageProvider === null) {
        throw Error('initSuiteSync[Desktop|Native]() must be called before this!');
    }

    return suiteSyncStorageProvider.getStorage(owner);
};
