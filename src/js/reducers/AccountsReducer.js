/* @flow */
'use strict';

import * as CONNECT from '../actions/constants/TrezorConnect';
import * as ADDRESS from '../actions/constants/address';

export type Account = {
    loaded: boolean;
    +network: string;
    +deviceID: string;
    +deviceState: ?string;
    +index: number;
    +addressPath: Array<number>;
    +address: string;
    balance: string;
    nonce: number;
}

const initialState: Array<Account> = [];

export const findAccount = (state: Array<Account>, index: number, deviceState: string, network: string): ?Account => {
    return state.find(a => a.deviceState === deviceState && a.index === index && a.network === network);
}

const createAccount = (state: Array<Account>, action: any): Array<Account> => {

    // TODO check with device_id
    // check if account was created before
    const exist: ?Account = state.find((account: Account) => account.address === action.address && account.network === action.network && account.deviceID === action.device.features.device_id);
    console.warn("MAM?", exist, action)
    if (exist) {
        return state;
    }

    const address: Account = {
        loaded: false,
        network: action.network,
        deviceID: action.device.features.device_id,
        deviceState: action.device.state,
        index: action.index,
        addressPath: action.path,
        address: action.address,
        balance: '0',
        nonce: 0,
    }

    const newState: Array<Account> = [ ...state ];
    newState.push(address);
    return newState;
}

const removeAccounts = (state: Array<Account>, action: any): Array<Account> => {
    return state.filter(account => account.deviceID !== action.device.features.device_id);
}

const forgetAccounts = (state: Array<Account>, action: any): Array<Account> => {
    return state.filter(account => action.accounts.indexOf(account) === -1);
}

const setBalance = (state: Array<Account>, action: any): Array<Account> => {
    const index: number = state.findIndex(account => account.address === action.address && account.network === action.network);
    const newState: Array<Account> = [ ...state ];
    newState[index].loaded = true;
    newState[index].balance = action.balance;
    return newState;
}

const setNonce = (state: Array<Account>, action: any): Array<Account> => {
    const index: number = state.findIndex(account => account.address === action.address && account.network === action.network);
    const newState: Array<Account> = [ ...state ];
    newState[index].loaded = true;
    newState[index].nonce = action.nonce;
    return newState;
}

export default (state: Array<Account> = initialState, action: any): Array<Account> => {

    switch (action.type) {

        case ADDRESS.CREATE :
            return createAccount(state, action);

        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return removeAccounts(state, action);

        //case CONNECT.FORGET_SINGLE :
        //    return forgetAccounts(state, action);

        case ADDRESS.SET_BALANCE :
            return setBalance(state, action);
        case ADDRESS.SET_NONCE :
            return setNonce(state, action);

        case ADDRESS.FROM_STORAGE :
            return action.payload;

        default:
            return state;
    }

}