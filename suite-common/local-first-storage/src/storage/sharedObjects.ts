import { EvoluKeys } from '@suite-common/wallet-core';

import { LocalFirstStorageProvider } from './LocalFirstStorageProvider';

type WalletDescriptor = string; // First btc testnet address
type SubscriptionKey = string; // for example: "labeling", ...

export const subscriptionStorage: Record<
    WalletDescriptor,
    Record<SubscriptionKey, () => void>
> = {};

export let localFirstStorageProvider: LocalFirstStorageProvider | null = null;

export const setLocalFirstStorageProvider = (provider: LocalFirstStorageProvider) => {
    localFirstStorageProvider = provider;
};

export const getLocalFirstStorageProvider = (evoluKeys: EvoluKeys) => {
    if (localFirstStorageProvider === null) {
        console.log('____initLocalFirstStorageThunk() must be called before this!');
        throw Error('initLocalFirstStorageThunk() must be called before this!');
    }

    return localFirstStorageProvider.getStorage(evoluKeys);
};
