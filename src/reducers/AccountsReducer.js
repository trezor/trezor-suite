/* @flow */


import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import * as ACCOUNT from 'actions/constants/account';

import type { Action, TrezorDevice } from 'flowtype';
import type {
    AccountSetBalanceAction,
    AccountSetNonceAction,
} from 'actions/AccountsActions';

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
    block: number;
    transactions: number;
}

export type State = Array<Account>;

const initialState: State = [];

export const findAccount = (state: State, index: number, deviceState: string, network: string): ?Account => state.find(a => a.deviceState === deviceState && a.index === index && a.network === network);

export const findDeviceAccounts = (state: State, device: TrezorDevice, network: string): Array<Account> => {
    if (network) {
        return state.filter(addr => addr.deviceState === device.state && addr.network === network);
    }
    return state.filter(addr => addr.deviceState === device.state);
};

const createAccount = (state: State, account: Account): State => {
    // TODO check with device_id
    // check if account was created before
    const exist: ?Account = state.find(a => a.address === account.address && a.network === account.network && a.deviceState === account.deviceState);
    if (exist) {
        return state;
    }
    const newState: State = [ ...state ];
    newState.push(account);
    return newState;
};

const removeAccounts = (state: State, device: TrezorDevice): State => state.filter(account => account.deviceState !== device.state);


const clear = (state: State, devices: Array<TrezorDevice>): State => {
    let newState: State = [...state];
    devices.forEach((d) => {
        newState = removeAccounts(newState, d);
    });
    return newState;
};

const updateAccount = (state: State, account: Account): State => {
    const index: number = state.findIndex(a => a.address === account.address && a.network === account.network && a.deviceState === account.deviceState);
    const newState: State = [...state];
    newState[index] = account;
    return newState;
}

const setBalance = (state: State, action: AccountSetBalanceAction): State => {
    // const index: number = state.findIndex(account => account.address === action.address && account.network === action.network && account.deviceState === action.deviceState);
    const index: number = state.findIndex(account => account.address === action.address && account.network === action.network);
    const newState: State = [...state];
    newState[index].loaded = true;
    newState[index].balance = action.balance;
    return newState;
};

const setNonce = (state: State, action: AccountSetNonceAction): State => {
    const index: number = state.findIndex(account => account.address === action.address && account.network === action.network && account.deviceState === action.deviceState);
    const newState: State = [...state];
    newState[index].loaded = true;
    newState[index].nonce = action.nonce;
    return newState;
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACCOUNT.CREATE:
            return createAccount(state, action.payload);

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
            return removeAccounts(state, action.device);

        case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            return clear(state, action.devices);

        //case CONNECT.FORGET_SINGLE :
        //    return forgetAccounts(state, action);

        case ACCOUNT.UPDATE :
            return updateAccount(state, action.payload);

        case ACCOUNT.SET_BALANCE:
            return setBalance(state, action);
        case ACCOUNT.SET_NONCE:
            return setNonce(state, action);

        case ACCOUNT.FROM_STORAGE:
            return action.payload;

        default:
            return state;
    }
};