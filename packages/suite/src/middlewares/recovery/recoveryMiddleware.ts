import { MiddlewareAPI } from 'redux';

import { isRecoveryInProgress, recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { deviceActions } from '@suite-common/device';
import { UI_REQUEST } from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { recoveryRerun } from 'src/actions/recovery/recoveryActions';
import { Action, AppState, Dispatch } from 'src/types/suite';

const recovery =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // pass action
        next(action);

        const state = api.getState();
        const recoveryStatus = selectRecoveryStatus(state);
        const { analytics } = state;

        if (
            action.type === UI_REQUEST.REQUEST_WORD &&
            recoveryStatus === 'waiting-for-confirmation'
        ) {
            // Since the device asked for a first word, we can safely assume we've received confirmation from the user
            api.dispatch(recoveryActions.setStatus('in-progress'));
        }

        if (
            deviceActions.updateSelectedDevice.match(action) &&
            action.payload?.features !== undefined &&
            isRecoveryInProgress(action.payload?.features) &&
            recoveryStatus !== 'in-progress'
        ) {
            api.dispatch(
                onboardingActions.updateAnalytics({
                    startTime: Date.now(),
                    seed: 'recovery-in-progress',
                }),
            );
            if (!analytics.confirmed) {
                // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics opt-out option first.
                api.dispatch(recoveryActions.setStatus('in-progress'));
            } else {
                api.dispatch(recoveryRerun());
            }
        }

        return action;
    };
export default recovery;
