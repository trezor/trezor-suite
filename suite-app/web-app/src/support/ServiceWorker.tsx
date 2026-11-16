import { useSelector } from 'react-redux';

import { selectIsDebugModeActive } from '@suite/debug';
import { selectIsDeviceLocked } from '@suite/locks';
import {
    useServiceWorkerCacheUpdates,
    useServiceWorkerRegistration,
    useServiceWorkerUpdates,
} from '@suite/service-worker';
import { selectIsServiceWorkerDevLogsEnabled, selectIsServiceWorkerEnabled } from '@suite/settings';
import { selectIsFirmwareInstallationRunning } from '@suite-common/firmware';
import { desktopQueryKeys, injectQueryClient } from '@suite-common/react-query';
import { isDevEnv } from '@suite-common/suite-utils';
import {
    getRankedTokenDefinitionsUrl,
    refreshTokenDefinitionsThunk,
} from '@suite-common/token-definitions';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

/**
 * Keeps the service worker registered as the Debug settings say and watches for its updates.
 * Token definitions the worker served from the previous visit are loaded again once it has stored newer ones.
 */
export const ServiceWorker = () => {
    const { dispatch, queryClient } = useServices(injectDispatch, injectQueryClient);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const isServiceWorkerEnabled = useSelector(selectIsServiceWorkerEnabled);
    const isDevLogsEnabled = useSelector(selectIsServiceWorkerDevLogsEnabled);
    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);
    const isDeviceLocked = useSelector(selectIsDeviceLocked);
    // The Debug settings switch counts only while debug mode is on, as the apps embedding showcase does.
    const isEnabled = isDebugModeActive && isServiceWorkerEnabled;

    useServiceWorkerRegistration({
        isEnabled,
        // Serwist keeps its logs only in dev builds.
        isDevLogsEnabled: isDevEnv && isDevLogsEnabled,
    });
    useServiceWorkerUpdates({
        isEnabled,
        isReloadDeferred: isFirmwareInstallationRunning || isDeviceLocked,
    });
    useServiceWorkerCacheUpdates({
        onCacheUpdate: url => {
            if (url === getRankedTokenDefinitionsUrl()) {
                queryClient.invalidateQueries({
                    queryKey: desktopQueryKeys.rankedTokenDefinitions(),
                });

                return;
            }

            dispatch(refreshTokenDefinitionsThunk({ url }));
        },
    });

    return null;
};
