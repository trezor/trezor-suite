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

    const { locks } = api.getState().suite;
    const isLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE);

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
