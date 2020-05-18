import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { DISCOVERY, ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import * as graphActions from '@wallet-actions/graphActions';
import { getDiscoveryForDevice } from '@wallet-actions/discoveryActions';
import { getAllAccounts } from '@wallet-utils/accountUtils';
import { AppState, Action, Dispatch } from '@suite-types';

const graphMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    next(action);
    const currentAccounts = api.getState().wallet.accounts;

    switch (action.type) {
        case SUITE.READY: {
            // In case a disconnected device is loaded from storage, there is no DISCOVERY.COMPLETE event on which the data would be fetched
            // so fetch the graph data for accounts belonging to disconnected devices on SUITE.READY instead (till storing to storage is implemented)
            const disconnectedDevices = api.getState().devices.filter(d => !d.connected);
            disconnectedDevices.forEach(d => {
                api.dispatch(
                    graphActions.updateGraphData(getAllAccounts(d.state, currentAccounts), {
                        newAccountsOnly: true,
                    }),
                );
            });
            break;
        }

        case DISCOVERY.COMPLETE:
            api.dispatch(graphActions.updateGraphData(currentAccounts, { newAccountsOnly: true }));
            break;

        case TRANSACTION.ADD: {
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
