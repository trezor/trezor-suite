import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { routerAppChanged } from '@suite/router';
import { selectIsAnalyticsConfirmed } from '@suite-common/analytics-redux';
import { deviceActions } from '@suite-common/device';
import { firmwareActions, selectFirmware } from '@suite-common/firmware';
import { createMiddleware } from '@suite-common/redux-utils';

import {
    enableOnboardingReducer,
    selectIsOnboardingActive,
    updateOnboardingAnalytics,
} from './onboardingReducer';
import { goToNextStep, recoveryRerun } from './onboardingThunks';

export const onboardingMiddleware = createMiddleware((action, { dispatch, getState, next }) => {
    const isFwInstallationDone =
        firmwareActions.setStatus.match(action) && action.payload === 'done';

    if (
        isFwInstallationDone &&
        selectIsOnboardingActive(getState()) &&
        selectFirmware(getState()).status === 'thp-pairing'
    ) {
        // After the THP pairing is finished we want to jump to the next step automatically.
        // User already drifted away from the installation flow and is not aware that THP is actually in the middle
        // of the Firmware installation.
        dispatch(goToNextStep());
        dispatch(firmwareActions.resetReducer());
    } else {
        next(action);
    }

    if (routerAppChanged.match(action) && action.payload === 'onboarding') {
        // here middleware detects that onboarding app is loaded, do following:
        //  1. make reducer to accept actions (enableReducer) and apply changes
        dispatch(enableOnboardingReducer(true));
    }

    if (
        deviceActions.updateSelectedDevice.match(action) &&
        action.payload?.features !== undefined &&
        isRecoveryInProgress(action.payload.features) &&
        selectRecoveryStatus(getState()) !== 'in-progress'
    ) {
        dispatch(
            updateOnboardingAnalytics({
                startTime: Date.now(),
                seed: 'recovery-in-progress',
            }),
        );

        if (!selectIsAnalyticsConfirmed(getState())) {
            // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics opt-out option first.
            dispatch(recoveryActions.setStatus('in-progress'));
        } else {
            dispatch(recoveryRerun());
        }
    }

    return action;
});
