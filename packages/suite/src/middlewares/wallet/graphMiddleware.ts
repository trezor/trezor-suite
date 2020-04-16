import { MiddlewareAPI } from 'redux';
// import { SUITE } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Action, Dispatch } from '@suite-types';

const graphMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    next(action);

    switch (action.type) {
        // case STORAGE.LOADED:
        //     api.dispatch(graphActions.updateGraphData(action.payload.wallet.accounts));
        //     break;

        // case DISCOVERY.COMPLETE:
        //     // todo: fetch data for added accounts only
        //     api.dispatch(graphActions.updateGraphData(api.getState().wallet.accounts));
        //     break;

        case ACCOUNT.CREATE:
            api.dispatch(graphActions.updateGraphData([action.payload]));
            break;

        case WALLET_SETTINGS.CHANGE_NETWORKS:
            api.dispatch(graphActions.updateGraphData(api.getState().wallet.accounts));
            break;

        default:
            break;
    }

    return action;
};

export default graphMiddleware;
