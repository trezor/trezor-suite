/* @flow */
'use strict';

import * as CONNECT from '../actions/constants/TrezorConnect';
import * as TOKEN from '../actions/constants/token';

import type { Action, TrezorDevice } from '../flowtype';

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

// Helper for actions
export const findToken = (state: Array<Token>, address: string, symbol: string, deviceState: string): ?Token => {
    return state.find(t => t.ethAddress === address && t.symbol === symbol && t.deviceState === deviceState);
}

// const setBalance = (state: State, payload: any): State => {
//     const newState: Array<Token> = [ ...state ];
//     let index: number = state.findIndex(t => t.address === payload.address && t.ethAddress === payload.ethAddress);
//     if (index >= 0) {
//         newState[index].loaded = true;
//         newState[index].balance = payload.balance;
//     }
//     return newState;
// }

const create = (state: State, token: Token): State => {
    const newState: Array<Token> = [ ...state ];
    newState.push(token);
    return newState;
}

const forget = (state: State, device: TrezorDevice): State => {
    return state.filter(t => t.deviceState !== device.state);
}

const remove = (state: State, token: Token): State => {
    return state.filter(t => {
        return !(t.ethAddress === token.ethAddress && t.address === token.address && t.deviceState === token.deviceState);
    });
}

export default (state: State = initialState, action: Action): State => {

    switch (action.type) {

        case TOKEN.FROM_STORAGE :
            return action.payload;

        case TOKEN.ADD :
            return create(state, action.payload);
        case TOKEN.REMOVE :
            return remove(state, action.token);
        case TOKEN.SET_BALANCE :
            return action.payload;

        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return forget(state, action.device);

        default:
            return state;
    }

}