/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import * as LocalStorageActions from '../actions/LocalStorageActions';

import { DEVICE } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as MODAL from '../actions/constants/modal';
import * as TOKEN from '../actions/constants/token';
import * as ADDRESS from '../actions/constants/address';
import * as DISCOVERY from '../actions/constants/discovery';
import * as SEND from '../actions/constants/send';
import * as WEB3 from '../actions/constants/web3';


// https://github.com/STRML/react-localstorage/blob/master/react-localstorage.js
// or
// https://www.npmjs.com/package/redux-react-session

const findAccounts = (devices, accounts) => {
    return devices.reduce((arr, dev) => {
        return arr.concat(accounts.filter(a => a.deviceState === dev.state));
    }, []);
}

const findTokens = (accounts, tokens) => {
    return accounts.reduce((arr, account) => {
        return arr.concat(tokens.filter(a => a.ethAddress === account.address));
    }, []);
}

const findDiscovery = (devices, discovery) => {
    return devices.reduce((arr, dev) => {
        return arr.concat(discovery.filter(a => a.deviceState === dev.state));
    }, []);
}

const findPendingTxs = (accounts, pending) => {
    return accounts.reduce((arr, account) => {
        return arr.concat(pending.filter(a => a.address === account.address));
    }, []);
}

const save = (dispatch, getState) => {
    const devices = getState().connect.devices.filter(d => d.remember === true && !d.unacquired);
    const accounts = findAccounts(devices, getState().accounts);
    const tokens = findTokens(accounts, getState().tokens);
    const pending = findPendingTxs(accounts, getState().pending);
    const discovery = findDiscovery(devices, getState().discovery);

    // save devices
    dispatch( LocalStorageActions.save('devices', JSON.stringify(devices) ) );

    // save already preloaded accounts
    dispatch( LocalStorageActions.save('accounts', JSON.stringify(accounts) ) );

    // save discovery state
    dispatch( LocalStorageActions.save('discovery', JSON.stringify(discovery) ) );

    // tokens
    dispatch( LocalStorageActions.save('tokens', JSON.stringify( tokens ) ) );

    // pending transactions
    dispatch( LocalStorageActions.save('pending', JSON.stringify( pending ) ) );
}


const LocalStorageService = (store: any) => (next: any) => (action: any) => {

    if (action.type === LOCATION_CHANGE) {
        const { location } = store.getState().router;
        if (!location) {
            // load data from config.json and local storage
            store.dispatch( LocalStorageActions.loadData() );
        }
    }

    next(action);

    switch (action.type) {

        // first time saving
        case CONNECT.REMEMBER :
            save(store.dispatch, store.getState);
        break;

        case TOKEN.ADD :
        case TOKEN.REMOVE :
        case TOKEN.SET_BALANCE :
            save(store.dispatch, store.getState);
            // store.dispatch( LocalStorageActions.save('tokens', JSON.stringify( tokens ) ) );
        break;

        case ADDRESS.CREATE :
        case ADDRESS.SET_BALANCE :
        case ADDRESS.SET_NONCE :
            save(store.dispatch, store.getState);
            //store.dispatch( LocalStorageActions.save('accounts', JSON.stringify( accounts ) ) );
        break;

        case DISCOVERY.START :
        case DISCOVERY.STOP :
        case DISCOVERY.COMPLETE :
        // case DISCOVERY.WAITING :
            save(store.dispatch, store.getState);
        break;

        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
        case DEVICE.CHANGED :
        case DEVICE.DISCONNECT :
        case CONNECT.AUTH_DEVICE :
        case CONNECT.SELECT_DEVICE :
            save(store.dispatch, store.getState);
            //store.dispatch( LocalStorageActions.save('devices', JSON.stringify( store.getState().connect.devices.filter(d => d.remember === true && !d.unacquired) ) ) );
            // store.dispatch( LocalStorageActions.save('selectedDevice', JSON.stringify( store.getState().connect.selectedDevice ) ) );
        break;

        case SEND.TX_COMPLETE :
        case WEB3.PENDING_TX_RESOLVED :
            save(store.dispatch, store.getState);
        break;

    }

    
};

export default LocalStorageService;