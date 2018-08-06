/* @flow */

import * as ACCOUNT from './constants/account';
import type { Action, TrezorDevice } from '~/flowtype';
import type { State } from '../reducers/AccountsReducer';

export type AccountAction =
    AccountFromStorageAction
  | AccountCreateAction
  | AccountSetBalanceAction
  | AccountSetNonceAction;

export type AccountFromStorageAction = {
    type: typeof ACCOUNT.FROM_STORAGE,
    payload: State
}

export type AccountCreateAction = {
    type: typeof ACCOUNT.CREATE,
    device: TrezorDevice,
    network: string,
    index: number,
    path: Array<number>,
    address: string
}

export type AccountSetBalanceAction = {
    type: typeof ACCOUNT.SET_BALANCE,
    address: string,
    network: string,
    deviceState: string,
    balance: string
}

export type AccountSetNonceAction = {
    type: typeof ACCOUNT.SET_NONCE,
    address: string,
    network: string,
    deviceState: string,
    nonce: number
}

export const setBalance = (address: string, network: string, deviceState: string, balance: string): Action => ({
    type: ACCOUNT.SET_BALANCE,
    address,
    network,
    deviceState,
    balance,
});

export const setNonce = (address: string, network: string, deviceState: string, nonce: number): Action => ({
    type: ACCOUNT.SET_NONCE,
    address,
    network,
    deviceState,
    nonce,
});