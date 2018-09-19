/* @flow */


import * as STORAGE from 'actions/constants/localStorage';

import type { Action } from 'flowtype';

export type Coin = {
    name: string;
    network: string;
    symbol: string;
    bip44: string;
    defaultGasLimit: number;
    defaultGasLimitTokens: number;
    defaultGasPrice: number;
    chainId: number;
    explorer: {
        tx: string;
        address: string;
    };
    tokens: string;
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
    coins: Array<Coin>;
    fiatValueTickers: Array<FiatValueTicker>;
}

export type CustomBackend = {
    name: string;
    url: string;
}


export type State = {
    initialized: boolean;
    error: ?string;
    config: Config;
    ERC20Abi: Array<Object>;
    tokens: TokensCollection;
    customBackend: Array<CustomBackend>;
}

const initialState: State = {
    initialized: false,
    error: null,
    config: {
        coins: [],
        fiatValueTickers: [],
    },
    ERC20Abi: [],
    tokens: {},
    customBackend: [
        {
            name: 'Custom1',
            slug: 'custom1',
            url: 'http://google.com',
        },
    ],
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
