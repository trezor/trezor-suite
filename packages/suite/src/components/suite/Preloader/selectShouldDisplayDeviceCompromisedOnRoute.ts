import type { RouterAppWithParams } from '@suite/router';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { selectShouldDisplayDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import type { AppState } from 'src/types/suite';

const ROUTES_TO_SKIP_FIRMWARE_CHECK: RouterAppWithParams['app'][] = [
    'settings',
    'firmware',
    'firmware-type',
    'firmware-custom',
];

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

const selectRouteApp = (state: AppState) => state.router.route?.app;

export const selectShouldDisplayDeviceCompromisedOnRoute = createMemoizedSelector(
    [selectShouldDisplayDeviceCompromised, selectRouteApp],
    (shouldDisplayDeviceCompromised, routeApp): boolean => {
        const displayOnRoute =
            routeApp === undefined || !ROUTES_TO_SKIP_FIRMWARE_CHECK.includes(routeApp);

        return displayOnRoute && shouldDisplayDeviceCompromised;
    },
);
