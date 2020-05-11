import { MiddlewareAPI } from 'redux';
import { DISCOVERY, ACCOUNT } from '@wallet-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { AppState, Action, Dispatch } from '@suite-types';

const graphMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    next(action);
    const currentAccounts = api.getState().wallet.accounts;

    switch (action.type) {
        case DISCOVERY.COMPLETE: {
            api.dispatch(graphActions.updateGraphData(currentAccounts, { newAccountsOnly: true }));
            break;
        }
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT: {
            // fetch graph data for selected account and range if needed
            if (action.payload.account) {
                api.dispatch(
                    graphActions.updateGraphData([action.payload.account], {
                        newAccountsOnly: true,
                    }),
                );
            }
            break;
        }

        default:
            break;
    }

    return action;
};

export default graphMiddleware;
