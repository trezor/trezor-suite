import { type CommonServices } from '@suite-common/extra-dependencies';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { type GetMMKVStorageDep } from '@suite-native/storage';
import { type GetSignVerifyDep } from '@suite-native-app/networks';

export type NativeServices = CommonServices &
    GetSignVerifyDep &
    NativeAnalyticsDep &
    GetMMKVStorageDep;
