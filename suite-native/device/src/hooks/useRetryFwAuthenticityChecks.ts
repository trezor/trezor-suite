import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { deviceAccessMutex, requestDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect, { FIRMWARE } from '@trezor/connect';
import { TimerId } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled } from '../selectors';

const REFRESH_INTERVAL = 3_000; // [ms]

export const useRetryFwAuthenticityChecks = () => {
    const firmwareRevisionCheckError = useSelector(
        selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled,
    );

    const isRetriableError =
        firmwareRevisionCheckError !== null &&
        isArrayMember(firmwareRevisionCheckError, FIRMWARE.REVISION_CHECK_RETRIABLE_ERRORS);

    useEffect(() => {
        let timeoutHandle: TimerId;
        const recheckFwRevision = () => {
            if (isRetriableError) {
                // refrain from scheduling multiple tasks (since this runs in a loop)
                if (deviceAccessMutex.taskQueue.length === 0) {
                    // any device call will cause the tests to be rerun, so getFeatures is used as the most basic one
                    // it'd be useless to await the result; what interests us is the Device state that updates, and gets propagated into redux
                    requestDeviceAccess(() => TrezorConnect.getFeatures());
                }
                timeoutHandle = setTimeout(recheckFwRevision, REFRESH_INTERVAL);
            }
        };

        if (isRetriableError) {
            timeoutHandle = setTimeout(recheckFwRevision, REFRESH_INTERVAL);
        }

        return () => clearTimeout(timeoutHandle);
    }, [isRetriableError]);
};
