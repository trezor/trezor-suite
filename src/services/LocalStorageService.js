/* @flow */
import { DEVICE } from 'trezor-connect';
import * as LocalStorageActions from 'actions/LocalStorageActions';
// import * as WalletActions from 'actions/WalletActions';

import * as CONNECT from 'actions/constants/TrezorConnect';
import * as TOKEN from 'actions/constants/token';
import * as ACCOUNT from 'actions/constants/account';
import * as DISCOVERY from 'actions/constants/discovery';
import * as SEND from 'actions/constants/send';
import * as PENDING from 'actions/constants/pendingTx';
import { findAccountTokens } from 'reducers/TokensReducer';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Dispatch,
    Action,
    GetState,
    TrezorDevice,
} from 'flowtype';

import type { Account } from 'reducers/AccountsReducer';
import type { Token } from 'reducers/TokensReducer';
import type { PendingTx } from 'reducers/PendingTxReducer';
import type { Discovery } from 'reducers/DiscoveryReducer';


// https://github.com/STRML/react-localstorage/blob/master/react-localstorage.js
// or
// https://www.npmjs.com/package/redux-react-session

const findAccounts = (devices: Array<TrezorDevice>, accounts: Array<Account>): Array<Account> => devices.reduce((arr, dev) => arr.concat(accounts.filter(a => a.deviceState === dev.state)), []);

const findTokens = (accounts: Array<Account>, tokens: Array<Token>): Array<Token> => accounts.reduce((arr, account) => arr.concat(findAccountTokens(tokens, account)), []);

const findDiscovery = (devices: Array<TrezorDevice>, discovery: Array<Discovery>): Array<Discovery> => devices.reduce((arr, dev) => arr.concat(discovery.filter(a => a.deviceState === dev.state && a.publicKey.length > 0)), []);

const findPendingTxs = (accounts: Array<Account>, pending: Array<PendingTx>): Array<PendingTx> => accounts.reduce((result, account) => result.concat(pending.filter(p => p.address === account.address && p.network === account.network)), []);

const save = (dispatch: Dispatch, getState: GetState): void => {
    const devices: Array<TrezorDevice> = getState().devices.filter(d => d.features && d.remember === true);
    const accounts: Array<Account> = findAccounts(devices, getState().accounts);
    const tokens: Array<Token> = findTokens(accounts, getState().tokens);
    const pending: Array<PendingTx> = findPendingTxs(accounts, getState().pending);
    const discovery: Array<Discovery> = findDiscovery(devices, getState().discovery);

    // save devices
    dispatch(LocalStorageActions.save('devices', JSON.stringify(devices)));

    // save already preloaded accounts
    dispatch(LocalStorageActions.save('accounts', JSON.stringify(accounts)));

    // save discovery state
    dispatch(LocalStorageActions.save('discovery', JSON.stringify(discovery)));

    // tokens
    dispatch(LocalStorageActions.save('tokens', JSON.stringify(tokens)));

    // pending transactions
    dispatch(LocalStorageActions.save('pending', JSON.stringify(pending)));
};


const LocalStorageService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    // Application live cycle starts here
    // if (action.type === LOCATION_CHANGE) {
    //     const { location } = api.getState().router;
    //     if (!location) {
    //         api.dispatch( WalletActions.init() );
    //         // load data from config.json and local storage
    //         api.dispatch( LocalStorageActions.loadData() );
    //     }
    // }

    next(action);

    switch (action.type) {
        // first time saving
        case CONNECT.REMEMBER:
            save(api.dispatch, api.getState);
            break;

        case TOKEN.ADD:
        case TOKEN.REMOVE:
        case TOKEN.SET_BALANCE:
            save(api.dispatch, api.getState);
            break;

        case ACCOUNT.CREATE:
        case ACCOUNT.SET_BALANCE:
        case ACCOUNT.SET_NONCE:
            save(api.dispatch, api.getState);
            break;

        case DISCOVERY.START:
        case DISCOVERY.STOP:
        case DISCOVERY.COMPLETE:
            save(api.dispatch, api.getState);
            break;

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
        case DEVICE.CHANGED:
        case DEVICE.DISCONNECT:
        case CONNECT.AUTH_DEVICE:
            save(api.dispatch, api.getState);
            break;

        case SEND.TX_COMPLETE:
        case PENDING.TX_RESOLVED:
        case PENDING.TX_REJECTED:
            save(api.dispatch, api.getState);
            break;

        default:
            return action;
    }

    return action;
};

export default LocalStorageService;