import { type TranslationKey } from '@suite/intl';
import { type SuiteSyncUserFacingErrorType } from '@suite-common/suite-sync-types';

export const suiteSyncErrorTranslationKeyMap: Record<SuiteSyncUserFacingErrorType, TranslationKey> =
    {
        DeviceCancelled: 'TR_SUITE_SYNC_ERROR_DEVICE_CANCELLED',
        DeviceError: 'TR_SUITE_SYNC_ERROR_DEVICE_ERROR',
        SuiteSyncUpdateError: 'TR_SUITE_SYNC_ERROR_UPDATE_FAILED',
        SuiteSyncUnavailableOnDeviceError: 'TR_SUITE_SYNC_ERROR_UNAVAILABLE',
        SuiteSyncFirmwareUpgradeNeededDeviceErrorType: 'TR_SUITE_SYNC_ERROR_UNAVAILABLE',
    };
