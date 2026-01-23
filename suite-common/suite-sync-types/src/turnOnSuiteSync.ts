import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceErrorType } from './refreshSuiteSyncKeys';
import { SuiteSyncFirmwareUpgradeNeededDeviceErrorType } from './storage/ensureWalletSuiteSyncOn';

type TurnOnSuiteSyncParams = {
    /**
     * You can optionally provide deviceStaticSessionId for which
     * the `ensureWalletSuiteSyncOn` will be called (keys, quota-manager, ...)
     *
     * It is optional for context where you do not have selected device.
     */
    deviceStaticSessionId: StaticSessionId | undefined;
};

export type TurnOnSuiteSync = (
    params: TurnOnSuiteSyncParams,
) => Promise<
    Result<
        void,
        | SuiteSyncUnavailableOnDeviceErrorType
        | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
    >
>;

export type TurnOnSuiteSyncDep = { turnOnSuiteSync: TurnOnSuiteSync };
