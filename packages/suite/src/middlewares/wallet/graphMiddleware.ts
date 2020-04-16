import { MiddlewareAPI } from 'redux';
import { ACCOUNT } from '@wallet-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Action, Dispatch } from '@suite-types';

const graphMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case ACCOUNT.CREATE:
            api.dispatch(graphActions.updateGraphData([action.payload]));
            break;

        default:
            break;
    }

    return action;
};

export default graphMiddleware;
