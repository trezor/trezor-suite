import { UI } from 'trezor-connect';
import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { AppState, Action, Dispatch } from '@suite-types';

const recovery = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    if (
        action.type === SUITE.APP_CHANGED &&
        (action.payload === 'recovery' || action.payload === 'onboarding')
    ) {
        api.dispatch(recoveryActions.resetReducer());
    }

    // pass action
    next(action);

    const { recovery } = api.getState();

    if (action.type === UI.REQUEST_WORD && recovery.status === 'waiting-for-confirmation') {
        // Since the device asked for a first word, we can safely assume we've received confirmation from the user
        api.dispatch(recoveryActions.setStatus('in-progress'));
    }

    if (action.type === SUITE.UPDATE_SELECTED_DEVICE) {
        if (
            // isLocked is not reliable in case we connect unacquired device. isLocked is turned to false AFTER
            // UPDATE_SELECTED_DEVICE is emitted
            // !isLocked &&
            action.type === SUITE.UPDATE_SELECTED_DEVICE &&
            // device is reported in recovery mode
            action.payload?.features?.recovery_mode &&
            // and suite is not in recovery mode yet
            recovery.status !== 'in-progress'
        ) {
            api.dispatch(recoveryActions.rerun());
        }
    }

    return action;
};
export default recovery;
