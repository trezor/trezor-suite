import type { MMKV } from 'react-native-mmkv';

import { type CommonServices } from '@suite-common/redux-utils';
import type { NativeAnalyticsDep } from '@suite-native/analytics';

export type NativeServices = CommonServices &
    NativeAnalyticsDep & {
        getMMKVStorage: () => Promise<MMKV>;
    };
