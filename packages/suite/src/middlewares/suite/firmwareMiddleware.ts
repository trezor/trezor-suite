import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@suite-actions/firmwareActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { AppState, Action, Dispatch } from '@suite-types';

const firmware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;

    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGED) {
        // here middleware detects that firmware 'app' is loaded, do following:
        //  1. make reducer to accept actions (enableReducer) and apply changes
        //  2. lock router (disable browser navigation)
        if (action.payload === 'firmware') {
            api.dispatch(firmwareActions.enableReducer(true));
            api.dispatch(suiteActions.lockRouter(true));
        }

        // here middleware detects that firmware 'app' is disposed, do following:
        //  1. reset state to initial and make reducer reject actions (enableReducer)
        if (action.payload !== 'firmware' && prevApp === 'firmware') {
            api.dispatch(firmwareActions.resetReducer());
        }
    }

    return action;
};
export default firmware;
