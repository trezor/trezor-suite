/* @flow */

import { BLOCKCHAIN } from 'trezor-connect';

import type { Action } from 'flowtype';

export type BlockchainNetwork = {
    +shortcut: string;
    connected: boolean;
}

export type State = Array<BlockchainNetwork>;

export const initialState: State = [];

const find = (state: State, shortcut: string): number => state.findIndex(b => b.shortcut === shortcut);

const connect = (state: State, action: any): State => {
    const shortcut = action.payload.coin.shortcut.toLowerCase();
    const network: BlockchainNetwork = {
        shortcut,
        connected: true,
    };
    const newState: State = [...state];
    const index: number = find(newState, shortcut);
    if (index >= 0) {
        newState[index] = network;
    } else {
        newState.push(network);
    }
    return newState;
};

const disconnect = (state: State, action: any): State => {
    const shortcut = action.payload.coin.shortcut.toLowerCase();
    const network: BlockchainNetwork = {
        shortcut,
        connected: false,
    };
    const newState: State = [...state];
    const index: number = find(newState, shortcut);
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