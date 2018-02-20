/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import * as LocalStorageActions from '../actions/LocalStorageActions';

import { DEVICE } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as MODAL from '../actions/constants/Modal';
import * as TOKEN from '../actions/constants/Token';
import * as ADDRESS from '../actions/constants/Address';
import * as DISCOVERY from '../actions/constants/Discovery';


// https://github.com/STRML/react-localstorage/blob/master/react-localstorage.js
// or
// https://www.npmjs.com/package/redux-react-session

const findAccounts = (devices, accounts) => {
    return devices.reduce((arr, dev) => {
        return arr.concat(accounts.filter(a => a.checksum === dev.checksum));
    }, []);
}

const findTokens = (accounts, tokens) => {
    return accounts.reduce((arr, account) => {
        return arr.concat(tokens.filter(a => a.ethAddress === account.address));
    }, []);
}

const findDiscovery = (devices, discovery) => {
    return devices.reduce((arr, dev) => {
        return arr.concat(discovery.filter(a => a.checksum === dev.checksum));
    }, []);
}

const save = (dispatch, getState) => {
    const devices = getState().connect.devices.filter(d => d.remember === true && !d.unacquired);
    const accounts = findAccounts(devices, getState().accounts);
    const tokens = findTokens(accounts, getState().tokens);
    const discovery = findDiscovery(devices, getState().discovery);

    // save devices
    dispatch( LocalStorageActions.save('devices', JSON.stringify(devices) ) );

    // save already preloaded accounts
    dispatch( LocalStorageActions.save('accounts', JSON.stringify(accounts) ) );

    // save discovery state
    dispatch( LocalStorageActions.save('discovery', JSON.stringify(discovery) ) );

    // tokens
    dispatch( LocalStorageActions.save('tokens', JSON.stringify( tokens ) ) );
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
            save(store.dispatch, store.getState);
            //store.dispatch( LocalStorageActions.save('devices', JSON.stringify( store.getState().connect.devices.filter(d => d.remember === true && !d.unacquired) ) ) );
            // store.dispatch( LocalStorageActions.save('selectedDevice', JSON.stringify( store.getState().connect.selectedDevice ) ) );
        break;

    }

    
};

export default LocalStorageService;