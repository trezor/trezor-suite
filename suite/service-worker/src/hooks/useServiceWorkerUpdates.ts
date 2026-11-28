import { useEffect, useState } from 'react';

import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { injectServiceWorkerControl } from '../control/serviceWorkerControl';
import { serviceWorkerUpdateActions } from '../serviceWorkerUpdateSlice';

/** Desktop looks for an update hourly as well. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
/** Switching tabs back and forth checks at most this often. */
const MINIMUM_UPDATE_CHECK_GAP_MS = 60 * 1000;

type UseServiceWorkerUpdatesParams = {
    isEnabled: boolean;
    /** A tab in a device flow, such as a firmware update, reloads once the flow is over. */
    isReloadDeferred: boolean;
};

/**
 * Keeps the waiting update in the store. Browsers look for a new worker only on navigations,
 * so a tab left open also looks hourly and whenever it becomes visible again.
 * Once a newer worker takes over, every tab reloads: the older build it runs
 * loads chunks that the new precache lacks and the server may no longer have.
 */
export const useServiceWorkerUpdates = ({
    isEnabled,
    isReloadDeferred,
}: UseServiceWorkerUpdatesParams) => {
    const { dispatch, serviceWorkerControl } = useServices(
        injectDispatch,
        injectServiceWorkerControl,
    );
    const [isTakenOver, setIsTakenOver] = useState(false);

    useEffect(
        () => serviceWorkerControl.listenForTakeover(() => setIsTakenOver(true)),
        [serviceWorkerControl],
    );

    useEffect(() => {
        if (isTakenOver && !isReloadDeferred) {
            serviceWorkerControl.reloadPage();
        }
    }, [isTakenOver, isReloadDeferred, serviceWorkerControl]);

    useEffect(() => {
        if (!isEnabled) {
            return;
        }

        const stopWatching = serviceWorkerControl.watchForUpdates(waitingUpdate =>
            dispatch(serviceWorkerUpdateActions.setWaitingUpdate(waitingUpdate)),
        );

        let lastCheckTime = Date.now();
        const checkForUpdate = () => {
            lastCheckTime = Date.now();
            serviceWorkerControl.checkForUpdate();
        };
        const handleVisibilityChange = () => {
            const isCheckDue = Date.now() - lastCheckTime >= MINIMUM_UPDATE_CHECK_GAP_MS;

            if (document.visibilityState === 'visible' && isCheckDue) {
                checkForUpdate();
            }
        };

        const interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopWatching();
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isEnabled, dispatch, serviceWorkerControl]);
};
