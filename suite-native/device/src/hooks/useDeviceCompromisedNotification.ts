import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type RevisionCheckErrorWithNotification,
    getIsRevisionCheckErrorWithNotification,
} from '@suite-common/firmware-authenticity';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

import { selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled } from '../selectors';

const revisionCheckNotifications: Record<RevisionCheckErrorWithNotification, TxKeyPath> = {
    'other-error': 'moduleDevice.toasts.firmwareRevisionCheckOtherError',
};

/**
 * Dispatch one-time toast notifications for firmware authenticity check errors.
 * duplicated with packages/suite/src/components/suite/SecurityCheck/useDeviceCompromisedNotification.ts
 * Because suite-native does not use the suite-common/toast-notification
 */
export const useDeviceCompromisedNotification = () => {
    const { translate } = useTranslate();
    const { showToast } = useToast();
    const revisionCheckError = useSelector(selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled);

    useEffect(() => {
        if (revisionCheckError === null) return;
        if (getIsRevisionCheckErrorWithNotification(revisionCheckError)) {
            showToast({
                variant: 'error',
                message: translate(revisionCheckNotifications[revisionCheckError]),
            });
        }
    }, [showToast, revisionCheckError, translate]);
};
