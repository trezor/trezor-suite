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

export type OnStorageEnsuredParams = EnsureWalletSuiteSyncOnParams & {
    storage: SuiteSyncStorage;
};

/**
 * Invoked after Suite Sync storage is ensured for a wallet (e.g. to run the legacy-labels
 * migration). Defaults to a no-op when a platform does not need it (e.g. native).
 */
export type OnStorageEnsured = (params: OnStorageEnsuredParams) => Promise<void> | void;

export type OnStorageEnsuredDep = {
    onStorageEnsured: OnStorageEnsured;
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
