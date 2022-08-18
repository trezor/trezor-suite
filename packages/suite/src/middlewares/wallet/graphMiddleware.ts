import { MiddlewareAPI } from 'redux';
import { DISCOVERY, TRANSACTION } from '@wallet-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { getDiscoveryForDevice } from '@wallet-actions/discoveryActions';
import { AppState, Action, Dispatch } from '@suite-types';
import { accountsActions } from '@suite-common/wallet-core/libDev/src';

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
            return action;
        }

        switch (action.type) {
            case DISCOVERY.COMPLETE:
                api.dispatch(
                    graphActions.updateGraphData(currentAccounts, { newAccountsOnly: true }),
                );
                break;

            case TRANSACTION.ADD: {
                const { account, transactions, page } = action.payload;
                if (page) {
                    // don't run while fetching txs pages in transactions tab
                    break;
                }

                // don't run during discovery and on unconfirmed txs
                const discovery = api.dispatch(getDiscoveryForDevice());
                if (
                    discovery?.status === DISCOVERY.STATUS.COMPLETED &&
                    transactions.some(t => (t.blockHeight ?? 0) > 0)
                ) {
                    api.dispatch(
                        graphActions.updateGraphData([account], { newAccountsOnly: false }),
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
