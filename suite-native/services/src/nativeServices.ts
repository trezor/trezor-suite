import type { MMKV } from 'react-native-mmkv';

import { CommonServices } from '@suite-common/redux-utils';

export type NativeServices = CommonServices & {
    getMMKVStorage: () => Promise<MMKV>;
};
