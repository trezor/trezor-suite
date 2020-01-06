import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@suite-actions/firmwareActions';
import { DEVICE } from 'trezor-connect';
import { AppState, Action, Dispatch } from '@suite-types';

const firmware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // console.log('firmware middleware');
    const prevApp = api.getState().router.app;

    // pass action
    next(action);

    const enabledApps = ['firmware', 'onboarding'];
    if (action.type === SUITE.APP_CHANGED) {
        // here middleware detects that firmware 'app' is loaded, do following:
        //  1. make reducer to accept actions (enableReducer) and apply changes
        if (enabledApps.includes(action.payload)) {
            api.dispatch(firmwareActions.enableReducer(true));
        }

        // here middleware detects that firmware 'app' is disposed, do following:
        //  1. reset state to initial and make reducer reject actions (enableReducer)
        if (!enabledApps.includes(action.payload) && enabledApps.includes(prevApp)) {
            api.dispatch(firmwareActions.resetReducer());
        }
    }

    const { status } = api.getState().firmware;

    switch (action.type) {
        case DEVICE.DISCONNECT:
            // if current status is error, reset to initial status on device disconnect
            if (status === 'error' || status === 'done') {
                api.dispatch(firmwareActions.resetReducer());
            }
            break;
        default:
    }

    return action;
};
export default firmware;
