import type { MMKV } from 'react-native-mmkv';

export type MMKVStorageDep = {
    getMMKVStorage: () => Promise<MMKV>;
};

export const injectMMKVStorage = (services: any): MMKVStorageDep => ({
    getMMKVStorage: services.getMMKVStorage,
});
