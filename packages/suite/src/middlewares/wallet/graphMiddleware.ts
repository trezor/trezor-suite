import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { accountsActions, discoveryActions } from '@suite-common/wallet-core';

import * as graphActions from 'src/actions/wallet/graphActions';
import { type AppState } from 'src/types/suite';

const graphMiddleware =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
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
            discoveryActions.updateDiscovery.match(action) &&
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
