import { MiddlewareAPI } from 'redux';
import { DISCOVERY } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Action, Dispatch } from '@suite-types';

const graphMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevAccounts = api.getState().wallet.accounts;
    next(action);
    const currentAccounts = api.getState().wallet.accounts;

    switch (action.type) {
        case DISCOVERY.COMPLETE: {
            // todo: fetch data for added accounts only
            // refetch the data only if on accounts change or if is a first fetch (handles also accounts loaded from storage)
            if (
                prevAccounts.length !== currentAccounts.length ||
                api.getState().wallet.graph.data.length === 0
            ) {
                api.dispatch(graphActions.updateGraphData(currentAccounts));
            }
            break;
        }

        case WALLET_SETTINGS.CHANGE_NETWORKS:
            api.dispatch(graphActions.updateGraphData(currentAccounts));
            break;

        default:
            break;
    }

    return action;
};

export default graphMiddleware;
