/* @flow */
import { DEVICE } from 'trezor-connect';
import * as LocalStorageActions from 'actions/LocalStorageActions';

import * as CONNECT from 'actions/constants/TrezorConnect';
import * as TOKEN from 'actions/constants/token';
import * as ACCOUNT from 'actions/constants/account';
import * as DISCOVERY from 'actions/constants/discovery';
import * as PENDING from 'actions/constants/pendingTx';
import * as WALLET from 'actions/constants/wallet';


import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
} from 'flowtype';

const LocalStorageService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case WALLET.HIDE_BETA_DISCLAIMER:
            api.dispatch(LocalStorageActions.hideBetaDisclaimer());
            break;
        // first time saving
        case CONNECT.REMEMBER:
            api.dispatch(LocalStorageActions.save());
            break;

        case TOKEN.ADD:
        case TOKEN.REMOVE:
        case TOKEN.SET_BALANCE:
            api.dispatch(LocalStorageActions.save());
            break;

        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE:
            api.dispatch(LocalStorageActions.save());
            break;

        case DISCOVERY.START:
        case DISCOVERY.STOP:
        case DISCOVERY.COMPLETE:
            api.dispatch(LocalStorageActions.save());
            break;

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
        case DEVICE.CHANGED:
        case DEVICE.DISCONNECT:
        case CONNECT.AUTH_DEVICE:
            api.dispatch(LocalStorageActions.save());
            break;

        case PENDING.ADD:
        case PENDING.TX_RESOLVED:
        case PENDING.TX_REJECTED:
            api.dispatch(LocalStorageActions.save());
            break;

        default:
            return action;
    }

    return action;
};

export default LocalStorageService;