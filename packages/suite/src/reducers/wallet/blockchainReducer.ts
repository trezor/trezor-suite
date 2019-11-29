import produce from 'immer';
import { BlockchainEvent, BlockchainInfo, BlockchainBlock, BLOCKCHAIN } from 'trezor-connect';
import { NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';

interface Info {
    url?: string;
    connected: boolean;
    error?: string;
    blockHash: string;
    blockHeight: number;
    version: string;
}

export type State = {
    [key in Network['symbol']]: Info;
};

const initialStatePredefined: Partial<State> = {};

// fill initial state, those values will be changed by BLOCKCHAIN.UPDATE_FEE action
export const initialState = NETWORKS.reduce((state, network) => {
    if (network.accountType) return state;
    state[network.symbol] = {
        connected: false,
        blockHash: '0',
        blockHeight: 0,
        version: '0',
    };
    return state;
}, initialStatePredefined as State);

const connect = (draft: State, info: BlockchainInfo) => {
    const symbol = info.coin.shortcut.toLowerCase();
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (network) {
        draft[network.symbol] = {
            url: info.url,
            connected: true,
            blockHash: info.blockHash,
            blockHeight: info.blockHeight,
            version: info.version,
        };
        delete draft[network.symbol].error;
    }
};

const error = (draft: State, symbol: string, error: string) => {
    const symbolLC = symbol.toLowerCase();
    const network = NETWORKS.find(n => n.symbol === symbolLC);
    if (network) {
        draft[network.symbol] = {
            ...draft[network.symbol],
            connected: false,
            error,
        };
        delete draft[network.symbol].url;
    }
};

const update = (draft: State, block: BlockchainBlock) => {
    const symbol = block.coin.shortcut.toLowerCase();
    const network = NETWORKS.find(n => n.symbol === symbol);
    if (network) {
        draft[network.symbol] = {
            ...draft[network.symbol],
            blockHash: block.blockHash,
            blockHeight: block.blockHeight,
        };
    }
};

export default (state: State = initialState, action: BlockchainEvent) => {
    return produce(state, draft => {
        switch (action.type) {
            case BLOCKCHAIN.CONNECT:
                connect(draft, action.payload);
                break;
            case BLOCKCHAIN.ERROR:
                error(draft, action.payload.coin.shortcut, action.payload.error);
                break;
            case BLOCKCHAIN.BLOCK:
                update(draft, action.payload);
                break;
            // no default
        }
    });
};
