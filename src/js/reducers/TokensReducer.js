/* @flow */
'use strict';

import * as CONNECT from '../actions/constants/TrezorConnect';
import * as TOKEN from '../actions/constants/token';

export type Token = {
    loaded: boolean;
    +deviceState: string;
    +name: string;
    +symbol: string;
    +address: string;
    +ethAddress: string; // foreign key
    +decimals: string;
    balance: string;
}

const initialState: Array<Token> = [];

const setBalance = (state: Array<Token>, payload: any): Array<Token> => {
    const newState: Array<Token> = [ ...state ];
    let index: number = state.findIndex(t => t.address === payload.address && t.ethAddress === payload.ethAddress);
    if (index >= 0) {
        newState[index].loaded = true;
        newState[index].balance = payload.balance;
    }
    return newState;
}

const create = (state: Array<Token>, payload: any): Array<Token> => {
    const newState: Array<Token> = [ ...state ];
    const token: Token = {
        loaded: false,
        deviceState: payload.deviceState,
        name: payload.name,
        symbol: payload.symbol,
        address: payload.address,
        ethAddress: payload.ethAddress,
        decimals: payload.decimals,
        balance: '0'
    }
    newState.push(token);
    return newState;
}

const forget = (state: Array<Token>, action: any): Array<Token> => {
    return state.filter(t => t.deviceState !== action.device.deviceState);
}

const remove = (state: Array<Token>, action: any): Array<Token> => {
    return state.filter(t => {
        return !(t.ethAddress === action.token.ethAddress && t.address === action.token.address);
    });
}

export default (state: Array<Token> = initialState, action: any): Array<Token> => {

    switch (action.type) {

        case TOKEN.ADD :
            return create(state, action.payload);

        case TOKEN.REMOVE :
            return remove(state, action);

        case TOKEN.SET_BALANCE :
            return setBalance(state, action.payload);

        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
            return forget(state, action);

        case TOKEN.FROM_STORAGE :
            return action.payload;

        default:
            return state;
    }

}