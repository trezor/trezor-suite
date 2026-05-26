import type { MMKV } from 'react-native-mmkv';

import { type CommonServices } from '@suite-common/redux-utils';
import type { NativeAnalyticsDep } from '@suite-native/analytics';

export type MMKVStorageDep = {
    getMMKVStorage: () => Promise<MMKV>;
};

export const selectMMKVStorageDep = (services: any): MMKVStorageDep => ({
    getMMKVStorage: services.getMMKVStorage,
});

export type NativeServices = CommonServices & NativeAnalyticsDep & MMKVStorageDep;
