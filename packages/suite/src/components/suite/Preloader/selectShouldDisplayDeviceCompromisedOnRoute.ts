import type { RouterAppWithParams } from '@suite/router';

import { selectShouldDisplayDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import type { AppState } from 'src/types/suite';

const ROUTES_TO_SKIP_FIRMWARE_CHECK: RouterAppWithParams['app'][] = [
    'settings',
    'firmware',
    'firmware-type',
    'firmware-custom',
];

export const selectShouldDisplayDeviceCompromisedOnRoute = (state: AppState): boolean => {
    const { router } = state;

    const shouldDisplayDeviceCompromised = selectShouldDisplayDeviceCompromised(state);

    const displayOnRoute =
        router.route?.app === undefined ||
        !ROUTES_TO_SKIP_FIRMWARE_CHECK.includes(router.route?.app);

    return displayOnRoute && shouldDisplayDeviceCompromised;
};
