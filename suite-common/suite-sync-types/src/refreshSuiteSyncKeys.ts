import { SuiteSyncOwner } from '@suite-common/suite-sync-storage';
import type { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/suite-types';
import { TrezorDevice } from '@suite-common/suite-types';
import { Result } from '@trezor/type-utils';

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
    isWriteMode: boolean;
};

/**
 * This error is used in cases where we need to get keys, but it is not possible
 * to get them. For example: Device is not connected, Device does not support Suite Sync.
 *
 * This error can be split if we need more granular error.
 */
export type SuiteSyncUnavailableOnDeviceErrorType = {
    type: 'SuiteSyncUnavailableOnDeviceError';
};

export type WriteModeRequiredForAllocationErrType = {
    type: 'WriteModeRequiredForAllocation';
};

export type RefreshSuiteSyncKeys = (
    params: RefreshSuiteSyncKeysParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | WriteModeRequiredForAllocationErrType
    >
>;

export type RefreshSuiteSyncKeysDep = {
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};
