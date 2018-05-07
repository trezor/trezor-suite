/* @flow */
'use strict';

import Web3 from 'web3';

import * as STORAGE from '../actions/constants/localStorage';
import * as WEB3 from '../actions/constants/web3';

import type { Action } from '../flowtype';
import type { 
    Web3CreateAction,
    Web3UpdateBlockAction,
    Web3UpdateGasPriceAction 
} from '../actions/Web3Actions';
import type { ContractFactory } from 'web3';

export type Web3Instance = {
    network: string;
    web3: Web3;
    chainId: number;
    latestBlock: any;
    gasPrice: string;
    erc20: ContractFactory;
}

export type State = Array<Web3Instance>;

const initialState: State = [];

const createWeb3 = (state: State, action: Web3CreateAction): State => {
    const instance: Web3Instance = {
        network: action.network,
        web3: action.web3,
        chainId: parseInt(action.chainId),
        latestBlock: '0',
        gasPrice: '0',
        erc20: action.erc20
    }
    const newState: Array<Web3Instance> = [ ...state ];
    newState.push(instance);
    return newState;
}

const updateLatestBlock = (state: State, action: Web3UpdateBlockAction): State => {
    const index: number = state.findIndex(w3 => w3.network === action.network);
    const newState: Array<Web3Instance> = [ ...state ];
    newState[index].latestBlock = action.blockHash;
    return newState;
}

const updateGasPrice = (state: State, action: Web3UpdateGasPriceAction): State => {
    const index: number = state.findIndex(w3 => w3.network === action.network);
    const newState: State = [ ...state ];
    newState[index].gasPrice = action.gasPrice;
    return newState;
}

export default function web3(state: State = initialState, action: Action): State {

    switch (action.type) {
        
        case WEB3.CREATE :
            return createWeb3(state, action);
        case WEB3.BLOCK_UPDATED :
            return updateLatestBlock(state, action);
        case WEB3.GAS_PRICE_UPDATED :
            return updateGasPrice(state, action);
        default:
            return state;
    }

}