import { type SuiteSyncOwner } from '@suite-common/suite-sync-storage';
import {
    type DelegatedIdentityKey,
    type DeviceCancelledErrType,
    type DeviceErrorType,
    type TrezorDevice,
} from '@suite-common/suite-types';
import { type Result } from '@trezor/type-utils';

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
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

export type RefreshSuiteSyncKeysResult = {
    owner: SuiteSyncOwner;
    delegatedKey: DelegatedIdentityKey;
};

export type RefreshSuiteSyncKeys = (
    params: RefreshSuiteSyncKeysParams,
) => Promise<
    Result<
        RefreshSuiteSyncKeysResult,
        SuiteSyncUnavailableOnDeviceErrorType | DeviceErrorType | DeviceCancelledErrType
    >
>;

export type RefreshSuiteSyncKeysDep = {
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};
