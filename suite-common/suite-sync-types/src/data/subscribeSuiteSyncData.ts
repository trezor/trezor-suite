import { SuiteSyncSchema, SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { WriteModeRequiredForAllocationErrType } from '../quotaManager/quotaManagerTypes';
import { SuiteSyncUnavailableOnDeviceErrorType } from '../refreshSuiteSyncKeys';

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
    ensureSuiteSyncData: SubscribeSuiteSyncData;
};
