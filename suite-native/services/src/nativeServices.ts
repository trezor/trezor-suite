import type { MMKV } from 'react-native-mmkv';

import { CommonServices } from '@suite-common/redux-utils';
import type { NativeLegacyAnalyticsDep } from '@suite-native/analytics';

export type NativeServices = CommonServices &
    NativeLegacyAnalyticsDep & {
        getMMKVStorage: () => Promise<MMKV>;
    };
