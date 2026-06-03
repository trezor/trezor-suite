import { type SuiteSyncOwner } from '@suite-common/suite-sync-storage';
import {
    type DelegatedIdentityKey,
    type DeviceCancelledErrType,
    type DeviceErrorType,
    type DeviceNotConnectedErrorType,
    type TrezorDevice,
} from '@suite-common/suite-types';
import { type Result } from '@trezor/type-utils';

type EnsureSuiteSyncKeysParams = {
    device: TrezorDevice;
};

/**
 * This error is used in cases where the device does not support Suite Sync,
 * or is in some unexpected state (does not have `state`, ...).
 */
export type SuiteSyncUnavailableOnDeviceErrorType = {
    type: 'SuiteSyncUnavailableOnDeviceError';
};

export type EnsureSuiteSyncKeysResult = {
    owner: SuiteSyncOwner;
    delegatedKey: DelegatedIdentityKey;
};

export type EnsureSuiteSyncKeys = (
    params: EnsureSuiteSyncKeysParams,
) => Promise<
    Result<
        EnsureSuiteSyncKeysResult,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | DeviceNotConnectedErrorType
    >
>;

export type EnsureSuiteSyncKeysDep = {
    ensureSuiteSyncKeys: EnsureSuiteSyncKeys;
};
