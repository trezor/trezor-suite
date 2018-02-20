/* @flow */
'use strict';

import Web3 from 'web3';

import * as STORAGE from '../actions/constants/LocalStorage';
import * as WEB3 from '../actions/constants/Web3';

type Web3Instance = {
    coin: string;
    web3: Web3;
    chainId: number;
    latestBlock: any;
    gasPrice: any;
    erc20: any;
}

const initialState: Array<Web3Instance> = [];

const createWeb3 = (state: Array<Web3Instance>, action: any): Array<Web3Instance> => {
    const instance: Web3Instance = {
        coin: action.name,
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

const updateLatestBlock = (state: Array<Web3Instance>, action: any): Array<Web3Instance> => {
    const index: number = state.findIndex(w3 => {
        return w3.coin === action.name;
    });
    const newState: Array<Web3Instance> = [ ...state ];
    newState[index].latestBlock = action.blockHash;
    return newState;
}

const updateGasPrice = (state: Array<Web3Instance>, action: any): Array<Web3Instance> => {
    const index: number = state.findIndex(w3 => {
        return w3.coin === action.coin;
    });
    const newState: Array<Web3Instance> = [ ...state ];
    newState[index].gasPrice = action.gasPrice;
    return newState;
}

export default function web3(state: Array<Web3Instance> = initialState, action: any): any {

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