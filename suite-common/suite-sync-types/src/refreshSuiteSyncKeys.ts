import { SuiteSyncOwner, TrezorDevice } from '@suite-common/suite-types';
import type { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
};

/**
 * This error is used in cases where we need to get keys, but it is not possible
 * to get them. For example: Device is not connected, Device does not support Suite Sync.
 *
 * This error can be split if we need more granular error.
 */
export type RefreshSuiteKeysUnavailableType = {
    type: 'RefreshSuiteKeysUnavailable';
};

export type RefreshSuiteSyncKeys = (
    params: RefreshSuiteSyncKeysParams,
) => Promise<
    Result<
        SuiteSyncOwner,
        RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType
    >
>;

export type RefreshSuiteSyncKeysDep = {
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};
