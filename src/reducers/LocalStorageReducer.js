/* @flow */


import * as STORAGE from 'actions/constants/localStorage';

import type { Action } from 'flowtype';

type NetworkFeeLevel = {
    name: string,
    value: string, // ETH: gasPrice in gwei, XRP: fee in drops, BTC: sat/b
    multiplier: number, // ETH specific
    blocks: number, // BTC specific
    recommended: boolean,
};

export type Network = {
    type: string;
    name: string;
    testnet?: boolean;
    shortcut: string;
    symbol: string;
    bip44: string;
    defaultGasLimit: number;
    defaultGasLimitTokens: number;
    defaultGasPrice: number;
    chainId: number; // ETH specific
    explorer: {
        tx: string;
        address: string;
    };
    tokens: string;
    decimals: number;
    fee: {
        defaultFee: string;
        minFee: string;
        maxFee: string;
        defaultGasLimit: string; // ETH specific
        defaultGasLimitTokens: string; // ETH specific
        levels: Array<NetworkFeeLevel>;
    },
    backends: Array<{
        name: string;
        urls: Array<string>;
    }>;
    web3: Array<string>;
}

export type NetworkToken = {
    address: string,
    name: string,
    symbol: string,
    decimals: number
}

export type TokensCollection = { [network: string]: Array<NetworkToken> };

// type AbiField = {
//     constant: boolean,
//     inputs: Array<{
//         name: string,
//         type: string,
//     }>,
//     name: string,
//     outputs: Array<{
//         name: string,
//         type: string,
//     }>,
//     payable: boolean,
//     stateMutability: string,
//     type: string
// }

export type FiatValueTicker = {
    network: string;
    url: string;
}

export type Config = {
    networks: Array<Network>;
    fiatValueTickers: Array<FiatValueTicker>;
}

export type State = {
    initialized: boolean;
    error: ?string;
    config: Config;
    ERC20Abi: Array<Object>;
    tokens: TokensCollection;
}

const initialState: State = {
    initialized: false,
    error: null,
    config: {
        networks: [],
        fiatValueTickers: [],
    },
    ERC20Abi: [],
    tokens: {},
};

export default function localStorage(state: State = initialState, action: Action): State {
    switch (action.type) {
        case STORAGE.READY:
            return {
                ...state,
                initialized: true,
                config: action.config,
                ERC20Abi: action.ERC20Abi,
                tokens: action.tokens,
                error: null,
            };

        case STORAGE.ERROR:
            return {
                ...state,
                error: action.error,
            };


        default:
            return state;
    }
}
