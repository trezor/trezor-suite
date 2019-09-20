import { MiddlewareAPI } from 'redux';
import { WALLET } from '@wallet-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';

// @ts-ignore // TODO: api parameter
const discoveryMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case WALLET.INIT_SUCCESS:
            // console.log('start dis');
            // api.dispatch(discoveryActions.start());
            break;
        default:
            break;
    }
    return action;
};

export default discoveryMiddleware;
