import { type SuiteSyncSchema, type SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { type DeviceCancelledErrType, type DeviceErrorType } from '@suite-common/suite-types';
import { type WalletDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

import { type WriteModeRequiredForAllocationErrType } from '../quotaManager/quotaManagerTypes';
import { type SuiteSyncUnavailableOnDeviceErrorType } from '../refreshSuiteSyncKeys';

type SubscribeSuiteSyncDataParams = {
    deviceStaticSessionId: StaticSessionId;
    isWriteMode: boolean;
};

export type Subscriptions = {
    [K in keyof SuiteSyncSchema]: (
        deviceStaticSessionId: StaticSessionId,
        entity: SuiteSyncSchema[K][],
    ) => void;
};

export type SuiteSyncListener = {
    onEntityChange: Subscriptions;
    onUnsubscribe: ({ walletDescriptor }: { walletDescriptor: WalletDescriptor }) => void;
};

export type SuiteSyncListenerDep = {
    suiteSyncListener: SuiteSyncListener;
};

export type SubscribeSuiteSyncData = (
    params: SubscribeSuiteSyncDataParams,
) => Promise<
    Result<
        SuiteSyncStorage,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | WriteModeRequiredForAllocationErrType
    >
>;

export type SubscribeSuiteSyncDataDep = {
    ensureSubscribeSuiteSyncData: SubscribeSuiteSyncData;
};
