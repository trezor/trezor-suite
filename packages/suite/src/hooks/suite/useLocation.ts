import { useSyncExternalStore } from 'react';

import type { RouterPath } from 'src/utils/suite/router';

import { useSuiteServices } from '../../support/SuiteServicesProvider';

/**
 * Hook that returns the current browser location and subscribes to location changes.
 * This makes the location reactive - the component will re-render when the URL changes.
 *
 * Uses useSyncExternalStore to properly synchronize with the router history.
 */
export const useLocation = (): RouterPath => {
    const { suiteRouterHistory } = useSuiteServices();

    return useSyncExternalStore(
        // Subscribe function - returns cleanup function
        callback => suiteRouterHistory.listen(() => callback()),
        // Get snapshot function - returns current state
        () => suiteRouterHistory.getLocation(),
        // Get server snapshot (for SSR) - same as client
        () => suiteRouterHistory.getLocation(),
    );
};
