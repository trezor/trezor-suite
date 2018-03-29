/* @flow */
'use strict';

import * as CONNECT from '../actions/constants/TrezorConnect';
import * as ADDRESS from '../actions/constants/Address';

export type Account = {
    loaded: boolean;
    +checksum: string;
    +coin: string;
    +index: number;
    +addressPath: Array<number>;
    +address: string;
    balance: string;
    nonce: number;
}

const initialState: Array<Account> = [];

const createAccount = (state: Array<Account>, action: any): Array<Account> => {

    // TODO check with device_id
    // check if account was created before
    const exist: ?Account = state.find(addr => addr.address === action.address && addr.coin === action.coin);
    if (exist) {
        return state;
    }

    const address: Account = {
        loaded: false,
        checksum: action.device.checksum,
        coin: action.coin,
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
    // TODO: all instances od device (multiple checksums)
    return state.filter(addr => addr.checksum !== action.device.checksum);
}

const forgetAccounts = (state: Array<Account>, action: any): Array<Account> => {
    return state.filter(addr => action.accounts.indexOf(addr) === -1);
}

const setBalance = (state: Array<Account>, action: any): Array<Account> => {
    const index: number = state.findIndex(addr => addr.address === action.address && addr.coin === action.coin);
    const newState: Array<Account> = [ ...state ];
    newState[index].loaded = true;
    newState[index].balance = action.balance;
    return newState;
}

const setNonce = (state: Array<Account>, action: any): Array<Account> => {
    const index: number = state.findIndex(addr => addr.address === action.address && addr.coin === action.coin);
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