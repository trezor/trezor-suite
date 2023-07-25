import { MiddlewareAPI } from 'redux';
import * as graphActions from 'src/actions/wallet/graphActions';
import { selectDiscoveryForDevice } from 'src/reducers/suite/suiteReducer';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { discoveryActions } from 'src/actions/wallet/discoveryActions';

import { accountsActions, transactionsActions } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

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
                    graphActions.updateGraphData([action.payload.account], {
                        newAccountsOnly: true,
                    }),
                );
            }
        }

        // don't run while fetching txs pages in transactions tab
        if (transactionsActions.addTransaction.match(action) && !action.payload.page) {
            const { account, transactions } = action.payload;

            // don't run during discovery and on unconfirmed txs
            const discovery = selectDiscoveryForDevice(api.getState());
            if (
                discovery?.status === DiscoveryStatus.COMPLETED &&
                transactions.some(t => (t.blockHeight ?? 0) > 0)
            ) {
                api.dispatch(
                    graphActions.updateGraphData([account], {
                        newAccountsOnly: false,
                    }),
                );
            }
        }

        switch (action.type) {
            case discoveryActions.completeDiscovery.type:
                api.dispatch(
                    graphActions.updateGraphData(currentAccounts, { newAccountsOnly: true }),
                );
                break;
            default:
                break;
        }
        return action;
    };

export default graphMiddleware;
