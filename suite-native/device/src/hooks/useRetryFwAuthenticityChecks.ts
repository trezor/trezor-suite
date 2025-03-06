import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import TrezorConnect, { FIRMWARE } from '@trezor/connect';
import { TimerId } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { selectFirmwareRevisionCheckErrorIfEnabled } from '../selectors';

const REFRESH_INTERVAL = 3_000; // [ms]

export const useRetryFwAuthenticityChecks = () => {
    const firmwareRevisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);

    const isRetriableError =
        firmwareRevisionCheckError !== null &&
        isArrayMember(firmwareRevisionCheckError, FIRMWARE.REVISION_CHECK_RETRIABLE_ERRORS);

    useEffect(() => {
        let timeoutHandle: TimerId;
        const recheckFwRevision = () => {
            if (isRetriableError) {
                // any device call will cause the tests to be rerun, so getFeatures is used as the most basic one
                // it'd be useless to await the result; what interests us is the Device state that updates, and gets propagated into redux
                TrezorConnect.getFeatures({ useEmptyPassphrase: true });
                timeoutHandle = setTimeout(recheckFwRevision, REFRESH_INTERVAL);
            }
        };

        if (isRetriableError) {
            timeoutHandle = setTimeout(recheckFwRevision, REFRESH_INTERVAL);
        }

        return () => clearTimeout(timeoutHandle);
    }, [isRetriableError]);
};
