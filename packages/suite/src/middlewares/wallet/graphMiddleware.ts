import { MiddlewareAPI } from 'redux';
import { DISCOVERY, ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { getDiscoveryForDevice } from '@wallet-actions/discoveryActions';
import { AppState, Action, Dispatch } from '@suite-types';

const graphMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);
        const currentAccounts = api.getState().wallet.accounts;

        switch (action.type) {
            case DISCOVERY.COMPLETE:
                api.dispatch(
                    graphActions.updateGraphData(currentAccounts, { newAccountsOnly: true }),
                );
                break;

            case TRANSACTION.ADD: {
                if (action.page) {
                    // don't run while fetching txs pages in transactions tab
                    break;
                }

                // don't run during discovery and on unconfirmed txs
                const discovery = api.dispatch(getDiscoveryForDevice());
                if (
                    discovery?.status === DISCOVERY.STATUS.COMPLETED &&
                    action.transactions.some(t => (t.blockHeight ?? 0) > 0)
                ) {
                    api.dispatch(
                        graphActions.updateGraphData([action.account], { newAccountsOnly: false }),
                    );
                }
                break;
            }

            case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
                // fetch graph data for selected account and range if needed
                if (action.payload.account) {
                    api.dispatch(
                        graphActions.updateGraphData([action.payload.account], {
                            newAccountsOnly: true,
                        }),
                    );
                }
                break;

            default:
                break;
        }

        return action;
    };

export default graphMiddleware;
