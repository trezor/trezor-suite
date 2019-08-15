import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types/index';
// import { WALLET } from '@wallet-actions/constants';
// import { SUITE } from '@suite-actions/constants';
// import * as discoveryActions from '@wallet-actions/discoveryActions';

// @ts-ignore // TODO: api parameter
const discoveryMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        // case WALLET.INIT_SUCCESS:
        //     console.log('start dis');
        //     api.dispatch(discoveryActions.start());
        //     break;
        default:
            break;
    }
    return action;
};

export default discoveryMiddleware;
