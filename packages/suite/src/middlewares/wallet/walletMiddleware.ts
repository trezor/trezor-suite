import { MiddlewareAPI } from 'redux';
import { LOCATION_CHANGE } from '@suite/actions/suite/routerActions';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import { loadStorage } from '@wallet-actions/storageActions';
import * as walletActions from '@wallet-actions/walletActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { SUITE } from '@suite/actions/suite/constants';
import { WALLET, DISCOVERY } from '@wallet-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';

// Flow: LOCATION.CHANGE -> WALLET.INIT -> load storage -> WALLET.INIT_SUCCESS
const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    // pass action
    next(action);

    // runs only in wallet app
    if (prevState.router.app !== 'wallet' && action.type !== LOCATION_CHANGE) return action;
    switch (action.type) {
        case DISCOVERY.UPDATE:
            // update discovery in selectedAccount
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;
        case LOCATION_CHANGE: {
            // update selected account if needed
            api.dispatch(selectedAccountActions.observe(prevState, action));

            // dispatch wallet init, then load storage
            api.dispatch(walletActions.init());
            break;
        }

        case WALLET.INIT:
            api.dispatch(loadStorage());
            break;

        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE:
            api.dispatch(discoveryActions.init());
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;
        default:
            break;
    }
    return action;
};

export default walletMiddleware;
