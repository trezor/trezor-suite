import { SuiteSyncStorage, SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/suite-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { WriteModeRequiredForAllocationErrType } from '../quotaManager/quotaManagerTypes';
import { SuiteSyncUnavailableOnDeviceErrorType } from '../refreshSuiteSyncKeys';

export type SuiteSyncFirmwareUpgradeNeededDeviceErrorType = {
    type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType';
};

export type EnsureWalletSuiteSyncOnParams = {
    deviceStaticSessionId: StaticSessionId;
    isWriteMode: boolean;
};

/**
 * Those are all errors that may happen during ensuring that SuiteSync is in on.
 * Typically most of them needs to be propagated all the way up into platform specific
 * code (components), as we need user's interaction/notification.
 */
export type EnsureWalletSuiteSyncOnErrors =
    | SuiteSyncUnavailableOnDeviceErrorType
    | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
    | DeviceErrorType
    | DeviceCancelledErrType
    | WriteModeRequiredForAllocationErrType;

export type EnsureWalletSuiteSyncOn = (
    params: EnsureWalletSuiteSyncOnParams,
) => Promise<Result<SuiteSyncStorage, EnsureWalletSuiteSyncOnErrors>>;

export type EnsureWalletSuiteSyncOnDep = { ensureWalletSuiteSyncOn: EnsureWalletSuiteSyncOn };

export type SuiteSyncUserFacingErrorType =
    | Exclude<EnsureWalletSuiteSyncOnErrors['type'], 'WriteModeRequiredForAllocation'>
    | SuiteSyncUpdateError['type'];
