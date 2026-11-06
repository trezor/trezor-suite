import { type CommonServices } from '@suite-common/extra-dependencies';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { type MMKVStorageDep } from '@suite-native/services';

export type NativeServices = CommonServices & NativeAnalyticsDep & MMKVStorageDep;
