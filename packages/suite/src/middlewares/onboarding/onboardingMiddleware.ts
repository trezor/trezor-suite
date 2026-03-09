import { MiddlewareAPI } from 'redux';

import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { deviceActions } from '@suite-common/device';
import { firmwareActions } from '@suite-common/firmware';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { SUITE } from 'src/actions/suite/constants';
import { Action, AppState, Dispatch } from 'src/types/suite';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const isFwInstallationDone =
            firmwareActions.setStatus.match(action) && action.payload === 'done';

        if (
            isFwInstallationDone &&
            api.getState().onboarding.isActive &&
            api.getState().firmware.status === 'thp-pairing'
        ) {
            // After the THP pairing is finished we want to jump to the next step automatically.
            // User already drifted away from the installation flow and is not aware that THP is actually in the middle
            // of the Firmware installation.
            api.dispatch(onboardingActions.goToNextStep());
            api.dispatch(firmwareActions.resetReducer());
        } else {
            // pass action
            next(action);
        }

        if (action.type === SUITE.APP_CHANGED) {
            // here middleware detects that onboarding app is loaded, do following:
            //  1. make reducer to accept actions (enableReducer) and apply changes
            if (action.payload === 'onboarding') {
                api.dispatch(onboardingActions.enableOnboardingReducer(true));
            }
        }

        if (
            deviceActions.updateSelectedDevice.match(action) &&
            action.payload?.features !== undefined &&
            isRecoveryInProgress(action.payload?.features) &&
            selectRecoveryStatus(api.getState()) !== 'in-progress'
        ) {
            api.dispatch(
                onboardingActions.updateAnalytics({
                    startTime: Date.now(),
                    seed: 'recovery-in-progress',
                }),
            );
            if (!api.getState().analytics.confirmed) {
                // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics opt-out option first.
                api.dispatch(recoveryActions.setStatus('in-progress'));
            } else {
                api.dispatch(onboardingActions.recoveryRerun());
            }
        }

        return action;
    };

export default onboardingMiddleware;
