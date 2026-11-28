import { useEffect } from 'react';

import { useServices } from '@trezor/dependency-injection';

import { injectServiceWorkerControl } from '../control/serviceWorkerControl';

/**
 * Turning the worker off reloads every tab, so reconciliation waits until the settings write
 * that changed the flag has reached IndexedDB. A quick toggle back and forth also reconciles once.
 */
const RECONCILE_DELAY_MS = 1000;

type UseServiceWorkerRegistrationParams = {
    isEnabled: boolean;
    isDevLogsEnabled: boolean;
};

/**
 * Keeps the registration in line with the flags on every boot and on every change:
 * registers the worker while it is enabled and removes it, with its caches, otherwise.
 */
export const useServiceWorkerRegistration = ({
    isEnabled,
    isDevLogsEnabled,
}: UseServiceWorkerRegistrationParams) => {
    const { serviceWorkerControl } = useServices(injectServiceWorkerControl);

    // An uninstall, started here or in another tab, asks every tab the worker controls to reload.
    useEffect(() => serviceWorkerControl.listenForReloadRequests(), [serviceWorkerControl]);

    useEffect(() => {
        const reconcile = async () => {
            const result = await serviceWorkerControl.reconcile({ isEnabled, isDevLogsEnabled });

            if (!result.success) {
                console.warn('Service worker reconciliation failed:', result.error);
            }
        };

        const timeout = setTimeout(reconcile, RECONCILE_DELAY_MS);

        return () => clearTimeout(timeout);
    }, [isEnabled, isDevLogsEnabled, serviceWorkerControl]);
};
