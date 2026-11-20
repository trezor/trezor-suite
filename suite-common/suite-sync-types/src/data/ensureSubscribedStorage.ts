import { type SuiteSyncSchema, type SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect-common';
import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
} from '@trezor/device';
import { type WalletDescriptor } from '@trezor/device-utils';
import { type LazyLoadingError } from '@trezor/lazy-loading';
import { type Result } from '@trezor/type-utils';

import { type SuiteSyncUnavailableOnDeviceErrorType } from '../ensureSuiteSyncKeys';
import {
    type QuotaManagerCommunicationFailedErrType,
    type WriteModeRequiredForAllocationErrType,
} from '../quotaManager/errors';

type EnsureSubscribedStorageParams = {
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

export type EnsureSubscribedStorage = (
    params: EnsureSubscribedStorageParams,
) => Promise<
    Result<
        SuiteSyncStorage,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | DeviceNotConnectedErrorType
        | WriteModeRequiredForAllocationErrType
        | QuotaManagerCommunicationFailedErrType
        | LazyLoadingError
    >
>;

export type EnsureSubscribedStorageDep = {
    ensureSubscribedStorage: EnsureSubscribedStorage;
};
