/* @flow */

import { BLOCKCHAIN } from 'trezor-connect';

import type { Action } from 'flowtype';
import type { BlockchainConnect, BlockchainError, BlockchainBlock } from 'trezor-connect';

export type BlockchainNetwork = {
    +shortcut: string,
    connected: boolean,
    fee: string,
    block: number,
};

export type State = Array<BlockchainNetwork>;

export const initialState: State = [];

const onConnect = (state: State, action: BlockchainConnect): State => {
    const shortcut = action.payload.coin.shortcut.toLowerCase();
    const network = state.find(b => b.shortcut === shortcut);
    const { info } = action.payload;
    if (network) {
        const others = state.filter(b => b !== network);
        return others.concat([{
            ...network,
            connected: true,
            fee: info.fee,
            block: info.block,
        }]);
    }

    return state.concat([{
        shortcut,
        connected: true,
        fee: info.fee,
        block: info.block,
    }]);
};

const onError = (state: State, action: BlockchainError): State => {
    const shortcut = action.payload.coin.shortcut.toLowerCase();
    const network = state.find(b => b.shortcut === shortcut);
    if (network) {
        const others = state.filter(b => b !== network);
        return others.concat([{
            ...network,
            connected: false,
        }]);
    }

    return state;
};

const onBlock = (state: State, action: BlockchainBlock): State => {
    const shortcut = action.payload.coin.shortcut.toLowerCase();
    const network = state.find(b => b.shortcut === shortcut);
    if (network) {
        const others = state.filter(b => b !== network);
        return others.concat([{
            ...network,
            block: action.payload.block,
        }]);
    }

    return state;
};


export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case BLOCKCHAIN.CONNECT:
            return onConnect(state, action);
        case BLOCKCHAIN.ERROR:
            return onError(state, action);
        case BLOCKCHAIN.BLOCK:
            return onBlock(state, action);

        default:
            return state;
    }
};