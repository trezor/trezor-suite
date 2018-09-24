/* @flow */


import Web3 from 'web3';

import type { Contract } from 'web3';
import * as WEB3 from 'actions/constants/web3';

import type { Action } from 'flowtype';
import type {
    Web3UpdateBlockAction,
    Web3UpdateGasPriceAction,
} from 'actions/Web3Actions';

export type Web3Instance = {
    network: string;
    web3: Web3;
    chainId: number;
    latestBlock: any;
    gasPrice: string;
    erc20: Contract;
}

export type State = Array<Web3Instance>;

const initialState: State = [];

const createWeb3 = (state: State, instance: Web3Instance): State => {
    const index: number = state.findIndex(w3 => w3.network === instance.network);
    const newState: Array<Web3Instance> = [...state];
    if (index >= 0) {
        newState[index] = instance;
    } else {
        newState.push(instance);
    }
    return newState;
};

const updateLatestBlock = (state: State, action: Web3UpdateBlockAction): State => {
    const index: number = state.findIndex(w3 => w3.network === action.network);
    const newState: Array<Web3Instance> = [...state];
    newState[index].latestBlock = action.blockHash;
    return newState;
};

const updateGasPrice = (state: State, action: Web3UpdateGasPriceAction): State => {
    const index: number = state.findIndex(w3 => w3.network === action.network);
    const newState: State = [...state];
    newState[index].gasPrice = action.gasPrice;
    return newState;
};

const disconnect = (state: State, instance: Web3Instance): State => {
    const index: number = state.indexOf(instance);
    const newState: Array<Web3Instance> = [...state];
    newState.splice(index, 1);
    return newState;
};

export default function web3(state: State = initialState, action: Action): State {
    switch (action.type) {
        case WEB3.CREATE:
            return createWeb3(state, action.instance);
        case WEB3.BLOCK_UPDATED:
            return updateLatestBlock(state, action);
        case WEB3.GAS_PRICE_UPDATED:
            return updateGasPrice(state, action);
        case WEB3.DISCONNECT:
            return disconnect(state, action.instance);
        default:
            return state;
    }
}