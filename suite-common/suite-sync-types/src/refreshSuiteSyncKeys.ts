import { SuiteSyncOwner, TrezorDevice } from '@suite-common/suite-types';
import type { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

type RefreshSuiteSyncKeysParams = {
    device: TrezorDevice;
};

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
