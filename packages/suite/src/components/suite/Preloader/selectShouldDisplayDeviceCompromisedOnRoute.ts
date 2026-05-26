import { selectShouldDisplayDeviceCompromised } from '@suite/authenticity-checks';
import type { RouterAppWithParams } from '@suite/router';

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
