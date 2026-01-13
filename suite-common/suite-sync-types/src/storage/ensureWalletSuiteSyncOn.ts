import { SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceErrorType } from '../refreshSuiteSyncKeys';

export type EnsureWalletSuiteSyncOnParams = { deviceStaticSessionId: StaticSessionId };

export type EnsureWalletSuiteSyncOn = (
    params: EnsureWalletSuiteSyncOnParams,
) => Promise<
    Result<
        SuiteSyncStorage,
        SuiteSyncUnavailableOnDeviceErrorType | DeviceErrorType | DeviceCancelledErrType
    >
>;

export type EnsureWalletSuiteSyncOnDep = {
    ensureWalletSuiteSyncOn: EnsureWalletSuiteSyncOn;
};
