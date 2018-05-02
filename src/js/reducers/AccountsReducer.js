/* @flow */
'use strict';

import * as CONNECT from '../actions/constants/TrezorConnect';
import * as ADDRESS from '../actions/constants/address';

import type { Action, TrezorDevice } from '../flowtype';
import type { 
    AddressCreateAction,
    AddressSetBalanceAction,
    AddressSetNonceAction
} from '../actions/AddressActions';

export type Account = {
    loaded: boolean;
    +network: string;
    +deviceID: string;
    +deviceState: string;
    +index: number;
    +addressPath: Array<number>;
    +address: string;
    balance: string;
    nonce: number;
}

export type State = Array<Account>;

const initialState: State = [];

export const findAccount = (state: State, index: number, deviceState: string, network: string): ?Account => {
    return state.find(a => a.deviceState === deviceState && a.index === index && a.network === network);
}

const createAccount = (state: State, action: AddressCreateAction): State => {

    // TODO check with device_id
    // check if account was created before
    const exist: ?Account = state.find((account: Account) => account.address === action.address && account.network === action.network && action.device.features && account.deviceID === action.device.features.device_id);
    if (exist) {
        return state;
    }

    const address: Account = {
        loaded: false,
        network: action.network,
        deviceID: action.device.features ? action.device.features.device_id : '0',
        deviceState: action.device.state || 'undefined',
        index: action.index,
        addressPath: action.path,
        address: action.address,
        balance: '0',
        nonce: 0,
    }

    const newState: State = [ ...state ];
    newState.push(address);
    return newState;
}

const removeAccounts = (state: State, device: TrezorDevice): State => {
    return state.filter(account => device.features && account.deviceID !== device.features.device_id);
}

// const forgetAccounts = (state: State, action: any): State => {
//     return state.filter(account => action.accounts.indexOf(account) === -1);
// }

const setBalance = (state: State, action: AddressSetBalanceAction): State => {
    const index: number = state.findIndex(account => account.address === action.address && account.network === action.network);
    const newState: State = [ ...state ];
    newState[index].loaded = true;
    newState[index].balance = action.balance;
    return newState;
}

const setNonce = (state: State, action: AddressSetNonceAction): State => {
    const index: number = state.findIndex(account => account.address === action.address && account.network === action.network);
    const newState: State = [ ...state ];
    newState[index].loaded = true;
    newState[index].nonce = action.nonce;
    return newState;
}

export default (state: State = initialState, action: Action): State => {

    switch (action.type) {

        case ADDRESS.CREATE :
            return createAccount(state, action);

        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return removeAccounts(state, action.device);

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