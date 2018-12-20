/* @flow */

import { BLOCKCHAIN as BLOCKCHAIN_EVENT } from 'trezor-connect';
import * as BLOCKCHAIN_ACTION from 'actions/constants/blockchain';

import type { Action } from 'flowtype';
import type { BlockchainConnect, BlockchainError, BlockchainBlock } from 'trezor-connect';

export type BlockchainNetwork = {
    +shortcut: string,
    connected: boolean,
    block: number,
    reserved: string, // xrp specific
    fee: string,
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
        block: info.block,
        fee: info.fee,
        reserved: info.reserved || '0',
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

    return state.concat([{
        shortcut,
        connected: false,
        block: 0,
        fee: '0',
        reserved: '0',
    }]);
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

const updateFee = (state: State, shortcut: string, fee: string): State => {
    const network = state.find(b => b.shortcut === shortcut);
    if (!network) return state;

    const others = state.filter(b => b !== network);
    return others.concat([{
        ...network,
        fee,
    }]);
};


export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case BLOCKCHAIN_EVENT.CONNECT:
            return onConnect(state, action);
        case BLOCKCHAIN_EVENT.ERROR:
            return onError(state, action);
        case BLOCKCHAIN_EVENT.BLOCK:
            return onBlock(state, action);
        case BLOCKCHAIN_ACTION.UPDATE_FEE:
            return updateFee(state, action.shortcut, action.fee);

        default:
            return state;
    }
};