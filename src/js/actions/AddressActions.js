/* @flow */
'use strict';

import * as ADDRESS from './constants/address';
import type { Action, TrezorDevice } from '../flowtype';
import type { State } from '../reducers/AccountsReducer';

export type AddressAction =
    AddressFromStorageAction
  | AddressCreateAction
  | AddressSetBalanceAction
  | AddressSetNonceAction;

export type AddressFromStorageAction = {
    type: typeof ADDRESS.FROM_STORAGE,
    payload: State
}

export type AddressCreateAction = {
    type: typeof ADDRESS.CREATE,
    device: TrezorDevice,
    network: string,
    index: number,
    path: Array<number>,
    address: string 
}

export type AddressSetBalanceAction = {
    type: typeof ADDRESS.SET_BALANCE,
    address: string,
    network: string,
    balance: string
}

export type AddressSetNonceAction = {
    type: typeof ADDRESS.SET_NONCE,
    address: string,
    network: string,
    nonce: number
}

export const setBalance = (address: string, network: string, balance: string): Action => {
    return {
        type: ADDRESS.SET_BALANCE,
        address,
        network,
        balance
    }
}