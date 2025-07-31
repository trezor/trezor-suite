import { selectIsFirmwareAuthenticityCheckDismissed } from '@suite-common/wallet-core';

import {
    selectIsEntropyCheckEnabledAndFailed,
    selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
} from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import type { AppState } from 'src/types/suite';

import { RouterAppWithParams } from '../../../constants/suite/routes';

const ROUTES_TO_SKIP_FIRMWARE_CHECK: RouterAppWithParams['app'][] = [
    'settings',
    'firmware',
    'firmware-type',
    'firmware-custom',
];

export const selectShouldDisplayDeviceCompromised = (state: AppState): boolean => {
    const { router } = state;

    const isFirmwareCheckEnabledAndFailed =
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed(state);
    const isFirmwareAuthenticityCheckDismissed = selectIsFirmwareAuthenticityCheckDismissed(state);

    // Entropy check won't be performed if disabled but we must also check it here to avoid showing the UI when the failed state is stored in database.
    const isEntropyCheckEnabledAndFailed = selectIsEntropyCheckEnabledAndFailed(state);

    return (
        (router.route?.app === undefined ||
            !ROUTES_TO_SKIP_FIRMWARE_CHECK.includes(router.route?.app)) &&
        ((!isFirmwareAuthenticityCheckDismissed && isFirmwareCheckEnabledAndFailed) ||
            isEntropyCheckEnabledAndFailed)
    );
};
