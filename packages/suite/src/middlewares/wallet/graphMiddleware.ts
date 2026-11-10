import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import {
    type AccountsRootState,
    accountsActions,
    selectAccounts,
    updateDiscoveryMatcher,
} from '@suite-common/wallet-core';
import { type Dispatch } from '@trezor/redux-utils';

import { type UpdateGraphDataThunkState } from '../../actions/wallet/graphActions';
import * as graphActions from '../../actions/wallet/graphActions';

type GraphMiddlewareState = AccountsRootState & UpdateGraphDataThunkState;

const graphMiddleware =
    (api: MiddlewareAPI<Dispatch, GraphMiddlewareState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        next(action);
        const currentAccounts = selectAccounts(api.getState());

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

        if (updateDiscoveryMatcher.match(action) && action.payload.status.status === 'complete') {
            api.dispatch(
                graphActions.updateGraphDataThunk({
                    accounts: currentAccounts,
                }),
            );
        }

        return action;
    };

export default graphMiddleware;
