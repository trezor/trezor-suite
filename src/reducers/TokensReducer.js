/* @flow */


import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import * as TOKEN from 'actions/constants/token';

import type { Action, TrezorDevice } from 'flowtype';

export type Token = {
    loaded: boolean;
    +deviceState: string;
    +network: string;
    +name: string;
    +symbol: string;
    +address: string;
    +ethAddress: string; // foreign key
    +decimals: number;
    balance: string;
}

export type State = Array<Token>;

const initialState: State = [];

const create = (state: State, token: Token): State => {
    const newState: State = [...state];
    newState.push(token);
    return newState;
};

const forget = (state: State, device: TrezorDevice): State => state.filter(t => t.deviceState !== device.state);

const clear = (state: State, devices: Array<TrezorDevice>): State => {
    let newState: State = [...state];
    devices.forEach((d) => {
        newState = forget(newState, d);
    });
    return newState;
};

const remove = (state: State, token: Token): State => state.filter(t => !(t.ethAddress === token.ethAddress && t.address === token.address && t.deviceState === token.deviceState));

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case TOKEN.FROM_STORAGE:
            return action.payload;

        case TOKEN.ADD:
            return create(state, action.payload);
        case TOKEN.REMOVE:
            return remove(state, action.token);
        case TOKEN.SET_BALANCE:
            return action.payload;

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
            return forget(state, action.device);

        case WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA:
            return clear(state, action.devices);

        default:
            return state;
    }
};