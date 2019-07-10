import * as STORAGE from '@suite/actions/wallet/constants/storage';
import { Action } from '@suite-types/index';
import { Network, NetworkToken } from '@wallet-types/index';
import produce from 'immer';

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
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.READY:
                draft.initialized = true;
                draft.tokens = action.tokens;
                draft.error = null;
                // draft.config = action.config;
                // draft.ERC20Abi = action.ERC20Abi;
                break;
            case STORAGE.ERROR:
                draft.error = action.error;
                break;
            default:
                break;
        }
    });
}
