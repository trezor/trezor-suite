import { EvoluKeys } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { LocalFirstStorageProvider } from './LocalFirstStorageProvider';

type SubscriptionKey = 'labeling'; // for example: "labeling", ...

export const subscriptionStorage: Record<
    WalletDescriptor,
    Partial<Record<SubscriptionKey, () => void>>
> = {};

export let localFirstStorageProvider: LocalFirstStorageProvider | null = null;

export const setLocalFirstStorageProvider = (provider: LocalFirstStorageProvider) => {
    localFirstStorageProvider = provider;
};

export const getLocalFirstStorageProvider = (evoluKeys: EvoluKeys) => {
    if (localFirstStorageProvider === null) {
        throw Error('initLocalFirstStorageThunk() must be called before this!');
    }

    return localFirstStorageProvider.getStorage(evoluKeys);
};
