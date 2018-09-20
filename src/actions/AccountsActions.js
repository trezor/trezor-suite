/* @flow */

import * as ACCOUNT from 'actions/constants/account';
import type { Action, TrezorDevice } from 'flowtype';
import type { Account, State } from 'reducers/AccountsReducer';

export type AccountFromStorageAction = {
    type: typeof ACCOUNT.FROM_STORAGE,
    payload: State
}

export type AccountCreateAction = {
    type: typeof ACCOUNT.CREATE,
    payload: Account,
}

export type AccountUpdateAction = {
    type: typeof ACCOUNT.UPDATE,
    payload: Account,
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

export type AccountAction =
    AccountFromStorageAction
  | AccountCreateAction
  | AccountUpdateAction
  | AccountSetBalanceAction
  | AccountSetNonceAction;

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

export const update = (account: Account): Action => ({
    type: ACCOUNT.UPDATE,
    payload: account
});
