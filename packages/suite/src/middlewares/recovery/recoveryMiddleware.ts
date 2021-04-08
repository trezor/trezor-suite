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

    const state = api.getState();
    const isLocked = state.suite.locks.includes(SUITE.LOCK_TYPE.DEVICE);

    if (action.type === UI.REQUEST_WORD && state.recovery.status === 'waiting-for-confirmation') {
        // Since the device asked for a first word, we can safely assume we've received confirmation from the user
        api.dispatch(recoveryActions.setStatus('in-progress'));
    }

    if (
        !isLocked &&
        action.type === SUITE.UPDATE_SELECTED_DEVICE &&
        action.payload &&
        action.payload.features?.recovery_mode
    ) {
        api.dispatch(recoveryActions.rerun());
    }

    return action;
};
export default recovery;
