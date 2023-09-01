import { MiddlewareAPI } from 'redux';

import { UI } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import * as recoveryActions from 'src/actions/recovery/recoveryActions';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { AppState, Action, Dispatch } from 'src/types/suite';

import { deviceActions } from '../../actions/suite/deviceActions';

const recovery =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (
            action.type === SUITE.APP_CHANGED &&
            (action.payload === 'recovery' || action.payload === 'onboarding')
        ) {
            api.dispatch(recoveryActions.resetReducer());
        }

        // pass action
        next(action);

        const { recovery, analytics } = api.getState();

        if (action.type === UI.REQUEST_WORD && recovery.status === 'waiting-for-confirmation') {
            // Since the device asked for a first word, we can safely assume we've received confirmation from the user
            api.dispatch(recoveryActions.setStatus('in-progress'));
        }

        if (
            deviceActions.updateSelectedDevice.match(action) &&
            action.payload?.features?.recovery_mode &&
            recovery.status !== 'in-progress'
        ) {
            api.dispatch(
                onboardingActions.updateAnalytics({
                    startTime: Date.now(),
                    seed: 'recovery-in-progress',
                }),
            );
            if (!analytics.confirmed) {
                // If you connect T2T1 in recovery mode to fresh Suite, you should see analytics optout option first.
                api.dispatch(recoveryActions.setStatus('in-progress'));
            } else {
                api.dispatch(recoveryActions.rerun());
            }
        }

        return action;
    };
export default recovery;
