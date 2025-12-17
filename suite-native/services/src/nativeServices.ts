import type { MMKV } from 'react-native-mmkv';

import { CommonServices } from '@suite-common/redux-utils';
import type { NativeAnalyticsDep, NativeLegacyAnalyticsDep } from '@suite-native/analytics';

export type NativeServices = CommonServices &
    NativeAnalyticsDep &
    NativeLegacyAnalyticsDep & {
        getMMKVStorage: () => Promise<MMKV>;
    };
