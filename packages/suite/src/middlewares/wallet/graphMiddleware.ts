import { type MiddlewareAPI } from 'redux';

import { accountsActions, discoveryActions } from '@suite-common/wallet-core';

import * as graphActions from 'src/actions/wallet/graphActions';
import { type Action, type AppState, type Dispatch } from 'src/types/suite';

const graphMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);
        const currentAccounts = api.getState().wallet.accounts;

        if (accountsActions.updateSelectedAccount.match(action)) {
            // fetch graph data for selected account and range if needed
            if (action.payload.account) {
                api.dispatch(
                    graphActions.updateGraphData({
                        accounts: [action.payload.account],
                    }),
                );
            }
        }

        if (
            action.type === discoveryActions.updateDiscovery.type &&
            action.payload.status.status === 'complete'
        ) {
            api.dispatch(
                graphActions.updateGraphData({
                    accounts: currentAccounts,
                }),
            );
        }

        return action;
    };

export default graphMiddleware;
