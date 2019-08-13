import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types/index';
// import { SUITE } from '@suite-actions/constants';
// import * as DiscoveryActions from '@wallet-actions/discoveryActions';

const discoveryMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        // case SUITE.SELECT_DEVICE:
        //     api.dispatch(DiscoveryActions.start());
        //     break;
        default:
            break;
    }
    return action;
};

export default discoveryMiddleware;
