import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@suite-actions/firmwareActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { AppState, Action, Dispatch } from '@suite-types';

const firmware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;
    const { locks } = api.getState().suite;

    // pass action
    next(action);

    const enabledApps = ['firmware', 'onboarding'];
    if (action.type === SUITE.APP_CHANGED) {
        // here middleware detects that firmware 'app' is loaded, do following:
        //  1. make reducer to accept actions (enableReducer) and apply changes
        if (enabledApps.includes(action.payload)) {
            api.dispatch(firmwareActions.enableReducer(true));

            if (!locks.includes(SUITE.LOCK_TYPE.ROUTER)) {
                api.dispatch(suiteActions.lockRouter(true));
            }
        }

        // here middleware detects that firmware 'app' is disposed, do following:
        //  1. reset state to initial and make reducer reject actions (enableReducer)
        if (!enabledApps.includes(action.payload) && enabledApps.includes(prevApp)) {
            api.dispatch(firmwareActions.resetReducer());
        }
    }

    return action;
};
export default firmware;
