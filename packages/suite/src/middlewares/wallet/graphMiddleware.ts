import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { type Dispatch } from '@suite-common/redux-utils';
import { accountsActions, discoveryActions } from '@suite-common/wallet-core';

import * as graphActions from 'src/actions/wallet/graphActions';
import { type AppState } from 'src/types/suite';

const graphMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        next(action);
        const currentAccounts = api.getState().wallet.accounts;

        if (accountsActions.updateSelectedAccount.match(action)) {
            // fetch graph data for selected account and range if needed
            if (action.payload.account) {
                api.dispatch(
                    graphActions.updateGraphDataThunk({
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
                graphActions.updateGraphDataThunk({
                    accounts: currentAccounts,
                }),
            );
        }

        return action;
    };

export default graphMiddleware;
