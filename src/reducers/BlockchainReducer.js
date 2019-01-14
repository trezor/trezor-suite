/* @flow */

import { BLOCKCHAIN as BLOCKCHAIN_EVENT } from 'trezor-connect';
import * as BLOCKCHAIN_ACTION from 'actions/constants/blockchain';

import type { Action } from 'flowtype';
import type { BlockchainConnect, BlockchainError, BlockchainBlock } from 'trezor-connect';

export type BlockchainFeeLevel = {
    name: string,
    value: string,
};

export type BlockchainNetwork = {
    +shortcut: string,
    feeTimestamp: number,
    feeLevels: Array<BlockchainFeeLevel>,
    connected: boolean,
    connecting: boolean,
    block: number,
};

export type State = Array<BlockchainNetwork>;

export const initialState: State = [];

const onStartSubscribe = (state: State, shortcut: string): State => {
    const network = state.find(b => b.shortcut === shortcut);
    if (network) {
        const others = state.filter(b => b !== network);
        return others.concat([{
            ...network,
            connecting: true,
        }]);
    }

    return state.concat([{
        shortcut,
        connected: false,
        connecting: true,
        block: 0,
        feeTimestamp: 0,
        feeLevels: [],
    }]);
};

const onConnect = (state: State, action: BlockchainConnect): State => {
    const shortcut = action.payload.coin.shortcut.toLowerCase();
    const network = state.find(b => b.shortcut === shortcut);
    const { info } = action.payload;
    if (network) {
        const others = state.filter(b => b !== network);
        return others.concat([{
            ...network,
            block: info.block,
            connected: true,
            connecting: false,
        }]);
    }

    return state.concat([{
        shortcut,
        connected: true,
        connecting: false,
        block: info.block,
        feeTimestamp: 0,
        feeLevels: [],
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
            connecting: false,
        }]);
    }

    return state.concat([{
        shortcut,
        connected: false,
        connecting: false,
        block: 0,
        feeTimestamp: 0,
        feeLevels: [],
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

const updateFee = (state: State, shortcut: string, feeLevels: Array<BlockchainFeeLevel>): State => {
    const network = state.find(b => b.shortcut === shortcut);
    if (!network) return state;

    const others = state.filter(b => b !== network);
    return others.concat([{
        ...network,
        feeTimestamp: new Date().getTime(),
        feeLevels,
    }]);
};


export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case BLOCKCHAIN_ACTION.START_SUBSCRIBE:
            return onStartSubscribe(state, action.shortcut);
        case BLOCKCHAIN_EVENT.CONNECT:
            return onConnect(state, action);
        case BLOCKCHAIN_EVENT.ERROR:
            return onError(state, action);
        case BLOCKCHAIN_EVENT.BLOCK:
            return onBlock(state, action);
        case BLOCKCHAIN_ACTION.UPDATE_FEE:
            return updateFee(state, action.shortcut, action.feeLevels);

        default:
            return state;
    }
};