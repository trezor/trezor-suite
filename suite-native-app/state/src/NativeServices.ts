import { type CommonServices } from '@suite-common/extra-dependencies';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { type GetMMKVStorageDep } from '@suite-native/storage';

export type NativeServices = CommonServices & NativeAnalyticsDep & GetMMKVStorageDep;
