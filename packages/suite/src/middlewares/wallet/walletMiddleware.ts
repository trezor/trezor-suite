import { MiddlewareAPI } from 'redux';
import { LOCATION_CHANGE } from '@suite/actions/suite/routerActions';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import { loadStorage } from '@wallet-actions/storageActions';
import * as walletActions from '@wallet-actions/walletActions';
import { SUITE } from '@suite/actions/suite/constants';
import { WALLET } from '@wallet-actions/constants';
import { getRouteFromPath } from '@suite/utils/suite/router';
import { AppState, Action, Dispatch } from '@suite-types';

const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    // pass action
    next(action);

    switch (action.type) {
        case LOCATION_CHANGE: {
            api.dispatch(selectedAccountActions.observe(prevState, action));
            const route = getRouteFromPath(action.url);
            console.log(route);
            if (route && route.pattern.startsWith('/wallet')) {
                // dispatch Wallet.INIT
                console.log('dispaatch');
                api.dispatch(walletActions.init());
            }
            break;
        }

        case WALLET.INIT:
            api.dispatch(loadStorage());
            break;

        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE:
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;
        default:
            break;
    }
    return action;
};

export default walletMiddleware;
