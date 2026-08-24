import type { MMKV } from 'react-native-mmkv';

export type MMKVStorageDep = {
    getMMKVStorage: () => Promise<MMKV>;
};

export const selectMMKVStorageDep = (services: any): MMKVStorageDep => ({
    getMMKVStorage: services.getMMKVStorage,
});
