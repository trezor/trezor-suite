/* @flow */

import { BLOCKCHAIN } from 'trezor-connect';

import type { Action } from 'flowtype';

export type BlockchainNetwork = {
    +name: string;
    connected: boolean;
}

export type State = Array<BlockchainNetwork>;

export const initialState: State  = [];

const find = (state: State, name: string): number => {
    return state.findIndex(b => b.name === name);
}

const connect = (state: State, action: any): State => {
    const network: BlockchainNetwork = {
        name: action.payload.coin,
        connected: true,
    }
    const newState: State = [...state];
    const index: number = find(newState, action.payload.coin);
    if (index >= 0) {
        newState[index] = network;
    } else {
        newState.push(network);
    }
    return newState;
};

const disconnect = (state: State, action: any): State => {
    const network: BlockchainNetwork = {
        name: action.payload.coin,
        connected: false,
    }
    const newState: State = [...state];
    const index: number = find(newState, action.payload.coin);
    if (index >= 0) {
        newState[index] = network;
    } else {
        newState.push(network);
    }
    return newState;
};


export default (state: State = initialState, action: Action): State => {
    switch (action.type) {

        case BLOCKCHAIN.CONNECT:
            return connect(state, action);
        case BLOCKCHAIN.ERROR:
            return disconnect(state, action);

        default:
            return state;
    }
};