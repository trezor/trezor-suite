import { type RequestPopupCallDep } from '@suite-common/connect-popup';
import { type CommonServices } from '@suite-common/extra-dependencies';
import { type ReferAFriendDep } from '@suite-common/refer-a-friend';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { type GetMMKVStorageDep } from '@suite-native/storage';
import { type GetSignVerifyDep } from '@trezor/network-module-suite-native-types';

export type NativeServices = CommonServices &
    GetSignVerifyDep &
    NativeAnalyticsDep &
    GetMMKVStorageDep &
    ReferAFriendDep &
    RequestPopupCallDep;
