import { SuiteSyncUserFacingErrorType } from '@suite-common/suite-sync-types';
import { TxKeyPath } from '@suite-native/intl';

export const suiteSyncErrorMessageMap: Record<SuiteSyncUserFacingErrorType, TxKeyPath> = {
    DeviceCancelled: 'suiteSync.errors.deviceCancelled',
    DeviceError: 'suiteSync.errors.deviceError',
    SuiteSyncUpdateError: 'suiteSync.errors.suiteSyncUpdateError',
    SuiteSyncUnavailableOnDeviceError: 'suiteSync.errors.suiteSyncUnavailable',
    SuiteSyncFirmwareUpgradeNeededDeviceErrorType: 'suiteSync.errors.suiteSyncUnavailable',
};
