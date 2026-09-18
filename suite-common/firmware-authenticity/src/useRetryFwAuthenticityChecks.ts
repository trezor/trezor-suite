import { useEffect } from 'react';

import { useGetter, useServices } from '@suite-common/dependency-injection';
import {
    injectRerunFwAuthenticityChecksCall,
    injectShouldRetryFirmwareRevisionCheckError,
} from '@suite-common/suite-types';
import { type TimerId } from '@trezor/type-utils';

const REFRESH_INTERVAL = 5_000; // [ms]

export const useRetryFwAuthenticityChecks = () => {
    const shouldRetryFwRevisionCheck = useGetter(injectShouldRetryFirmwareRevisionCheckError);
    const { rerunFwAuthenticityChecksCall } = useServices(injectRerunFwAuthenticityChecksCall);

    useEffect(() => {
        let timeoutHandle: TimerId;
        const recheckFwRevision = () => {
            if (shouldRetryFwRevisionCheck) {
                rerunFwAuthenticityChecksCall();
                timeoutHandle = setTimeout(recheckFwRevision, REFRESH_INTERVAL);
            }
        };

        // first invocation just starts the timer without performing the retry
        if (shouldRetryFwRevisionCheck) {
            timeoutHandle = setTimeout(recheckFwRevision, REFRESH_INTERVAL);
        }

        return () => clearTimeout(timeoutHandle);
    }, [shouldRetryFwRevisionCheck, rerunFwAuthenticityChecksCall]);
};
