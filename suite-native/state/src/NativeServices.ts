import { type CommonServices } from '@suite-common/extra-dependencies';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { type NativeNetworksDep } from '@suite-native/networks';
import { type MMKVStorageDep } from '@suite-native/services';

export type NativeServices = CommonServices &
    NativeAnalyticsDep &
    NativeNetworksDep &
    MMKVStorageDep;
