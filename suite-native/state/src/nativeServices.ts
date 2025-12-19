import type { MMKV } from 'react-native-mmkv';

import type { ExtraDependencies } from '@suite-common/redux-utils';
import type { MMKVStorageDep } from '@suite-native/storage';

// NOTE: just handy re-export
export type CommonServices = ExtraDependencies['services'];

export type NativeServices = CommonServices & {
    getMMKVStorage: () => Promise<MMKV>;
};

export const buildNativeServices = ({
    commonServices,
    mmkvStorage,
}: {
    commonServices: CommonServices;
} & MMKVStorageDep): NativeServices => ({
    ...commonServices,
    getMMKVStorage: () => mmkvStorage.getMMKV(),
});
