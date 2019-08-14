import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types/index';
import { WALLET } from '@suite/actions/wallet/constants';
// import { SUITE } from '@suite-actions/constants';
import * as discoveryActions from '@wallet-actions/discoveryActions';

const discoveryMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case WALLET.INIT:
            api.dispatch(discoveryActions.start());
            break;
        default:
            break;
    }
    return action;
};

export default discoveryMiddleware;
