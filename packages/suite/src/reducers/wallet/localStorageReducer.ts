import * as STORAGE from '@suite/actions/wallet/constants/storage';
import { Action } from '@suite-types/index';
import { Network, NetworkToken } from '@wallet-types/index';

export interface TokensCollection {
    [network: string]: NetworkToken[];
}

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

export interface FiatValueTicker {
    network: string;
    url: string;
}

export interface Config {
    networks: Network[];
    fiatValueTickers: FiatValueTicker[];
}

export interface State {
    initialized: boolean;
    error?: string | null;
    config: Config;
    ERC20Abi: Record<string, any>[];
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
                // config: action.config,
                // ERC20Abi: action.ERC20Abi,
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
