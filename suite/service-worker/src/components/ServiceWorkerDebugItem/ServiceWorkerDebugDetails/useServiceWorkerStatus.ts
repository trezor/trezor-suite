import { useEffect, useState } from 'react';

import { type Result } from '@trezor/type-utils';

import {
    type ServiceWorkerControl,
    type ServiceWorkerStatus,
} from '../../../control/serviceWorkerControl';

const STATUS_POLL_INTERVAL_MS = 2000;

type ServiceWorkerStatusResult = Result<ServiceWorkerStatus | null, string>;

type UseServiceWorkerStatusParams = {
    serviceWorkerControl: ServiceWorkerControl;
};

/** The registration changes in the background while a worker installs, so the status is polled. */
export const useServiceWorkerStatus = ({ serviceWorkerControl }: UseServiceWorkerStatusParams) => {
    const [statusResult, setStatusResult] = useState<ServiceWorkerStatusResult | null>(null);

    useEffect(() => {
        let isUnmounted = false;

        const refreshStatus = async () => {
            const result = await serviceWorkerControl.getStatus();

            if (!isUnmounted) {
                setStatusResult(result);
            }
        };

        refreshStatus();
        const interval = setInterval(refreshStatus, STATUS_POLL_INTERVAL_MS);

        return () => {
            isUnmounted = true;
            clearInterval(interval);
        };
    }, [serviceWorkerControl]);

    return statusResult;
};
