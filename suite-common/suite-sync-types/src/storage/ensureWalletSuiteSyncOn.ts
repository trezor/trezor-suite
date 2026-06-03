import { type SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import {
    type DeviceCancelledErrType,
    type DeviceErrorType,
    type DeviceNotConnectedErrorType,
} from '@suite-common/suite-types';
import { type StaticSessionId } from '@trezor/connect-common';
import { type Result } from '@trezor/type-utils';

import { type SuiteSyncUnavailableOnDeviceErrorType } from '../ensureSuiteSyncKeys';
import {
    type QuotaManagerCommunicationFailedErrType,
    type WriteModeRequiredForAllocationErrType,
} from '../quotaManager/errors';

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
    | DeviceNotConnectedErrorType
    | WriteModeRequiredForAllocationErrType
    | QuotaManagerCommunicationFailedErrType;

export type EnsureWalletSuiteSyncOn = (
    params: EnsureWalletSuiteSyncOnParams,
) => Promise<Result<SuiteSyncStorage, EnsureWalletSuiteSyncOnErrors>>;

export type WalletSuiteSyncOnEnsuredParams = EnsureWalletSuiteSyncOnParams & {
    storage: SuiteSyncStorage;
};

export type WalletSuiteSyncOnEnsuredListener = (
    params: WalletSuiteSyncOnEnsuredParams,
) => Promise<void> | void;

export type OnWalletSuiteSyncOnEnsured = (listener: WalletSuiteSyncOnEnsuredListener) => void;

export type OnWalletSuiteSyncOnEnsuredDep = {
    onWalletSuiteSyncOnEnsured: OnWalletSuiteSyncOnEnsured;
};

export type EnsureWalletSuiteSyncOnDep = { ensureWalletSuiteSyncOn: EnsureWalletSuiteSyncOn };

export const selectEnsureWalletSuiteSyncOnDep = (services: any): EnsureWalletSuiteSyncOnDep => ({
    ensureWalletSuiteSyncOn: services.suiteSync.ensureWalletSuiteSyncOn,
});

export type EnsureWalletSuiteSyncOnUncontrolled = (
    params: EnsureWalletSuiteSyncOnParams,
) => Promise<void>;

export type EnsureWalletSuiteSyncOnUncontrolledDep = {
    ensureWalletSuiteSyncOnUncontrolled: EnsureWalletSuiteSyncOnUncontrolled;
};

export const selectEnsureWalletSuiteSyncOnUncontrolledDep = (
    services: any,
): EnsureWalletSuiteSyncOnUncontrolledDep => ({
    ensureWalletSuiteSyncOnUncontrolled: services.suiteSync.ensureWalletSuiteSyncOnUncontrolled,
});

export type SuiteSyncUserFacingErrorType =
    | 'SuiteSyncUnavailableOnDeviceError'
    | 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType'
    | 'DeviceCancelled'
    | 'DeviceError'
    | 'SuiteSyncUpdateError'
    | 'QuotaManagerCommunicationFailed';
