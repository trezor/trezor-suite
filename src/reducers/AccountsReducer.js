/* @flow */


import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import * as ACCOUNT from 'actions/constants/account';

import type { Action, TrezorDevice } from 'flowtype';

type AccountCommon = {
    +imported: boolean,
    +index: number,
    +network: string, // network id (shortcut)
    +deviceID: string, // empty for imported accounts
    +deviceState: string, // empty for imported accounts
    +accountPath: Array<number>, // empty for imported accounts
    +descriptor: string, // address or xpub

    balance: string,
    availableBalance: string, // balance - pending
    block: number, // last known (synchronized) block
    empty: boolean, // account without transactions

    transactions: number, // deprecated
};

export type Account = AccountCommon & {
    networkType: 'ethereum',
    nonce: number,
} | AccountCommon & {
    networkType: 'ripple',
    sequence: number,
    reserve: string,
} | AccountCommon & {
    networkType: 'bitcoin',
    addressIndex: number,
};

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
    const exist: ?Account = state.find(a => a.descriptor === account.descriptor && a.network === account.network && a.deviceState === account.deviceState);
    if (exist) {
        return state;
    }
    const newState: State = [...state];
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
    const index: number = state.findIndex(a => a.descriptor === account.descriptor && a.network === account.network && a.deviceState === account.deviceState);
    const newState: State = [...state];
    newState[index] = account;
    return newState;
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACCOUNT.CREATE:
            return createAccount(state, action.payload);

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
            return removeAccounts(state, action.device);

        case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            return clear(state, action.devices);

        //case CONNECT.FORGET_SINGLE :
        //    return forgetAccounts(state, action);

        case ACCOUNT.UPDATE:
            return updateAccount(state, action.payload);

        case ACCOUNT.FROM_STORAGE:
            return action.payload;

        default:
            return state;
    }
};