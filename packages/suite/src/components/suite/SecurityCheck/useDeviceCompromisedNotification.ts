import { useEffect } from 'react';

import { useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import {
    type RevisionCheckErrorWithNotification,
    getIsRevisionCheckErrorWithNotification,
} from '@suite-common/firmware-authenticity';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { useDispatch } from 'src/hooks/suite';

const revisionCheckNotifications: Record<RevisionCheckErrorWithNotification, TranslationKey> = {
    'other-error': 'TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR',
};

/**
 * Dispatch one-time toast notifications for firmware authenticity check errors.
 * duplicated with suite-native/device/src/hooks/useDeviceCompromisedNotification.ts
 * Because suite-native does not use the suite-common/toast-notification
 */
export const useDeviceCompromisedNotification = () => {
    const { device } = useDevice();
    const dispatch = useDispatch();

    const revCheck = isDeviceAcquired(device) ? device.authenticityChecks?.firmwareRevision : null;
    const isError = revCheck && !revCheck.success;
    const errorType = isError ? revCheck.error : null;

    useEffect(() => {
        if (errorType === null) return;
        if (getIsRevisionCheckErrorWithNotification(errorType)) {
            dispatch(
                notificationsActions.addToast({
                    type: 'firmware-authenticity-check-error',
                    translationKey: revisionCheckNotifications[errorType],
                }),
            );
        }
    }, [dispatch, errorType]);
};
