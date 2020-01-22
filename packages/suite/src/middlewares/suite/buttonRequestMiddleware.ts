import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';
import { UI } from 'trezor-connect';

const buttonRequest = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case UI.REQUEST_PIN:
            api.dispatch({
                type: SUITE.ADD_BUTTON_REQUEST,
                device: api.getState().suite.device,

                payload: action.type,
            });
            break;
        case UI.REQUEST_BUTTON:
            api.dispatch({
                type: SUITE.ADD_BUTTON_REQUEST,
                device: api.getState().suite.device,
                payload: action.payload.code,
            });
            break;
        case SUITE.LOCK_DEVICE:
            if (!action.payload) {
                api.dispatch({
                    type: SUITE.ADD_BUTTON_REQUEST,
                    device: api.getState().suite.device,
                    payload: null,
                });
            }

            break;
        default:
        // no default
    }

    return action;
};
export default buttonRequest;
