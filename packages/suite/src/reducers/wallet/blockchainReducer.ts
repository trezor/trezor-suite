import produce, { Draft } from 'immer';
import { BlockchainInfo, BlockchainBlock } from 'trezor-connect';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import { getNetwork } from '@wallet-utils/accountUtils';
import { NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';
import { Action } from '@suite-types';

interface BlockchainReconnection {
    id: ReturnType<typeof setTimeout>; // setTimeout id
    time: number; // timestamp when it will be resolved
    count: number; // number of tries
}

export interface Blockchain {
    url?: string;
    explorer: {
        tx: string;
        account: string;
    };
    connected: boolean;
    subscribed?: boolean;
    error?: string;
    blockHash: string;
    blockHeight: number;
    version: string;
    reconnection?: BlockchainReconnection;
}

export type BlockchainState = {
    [key in Network['symbol']]: Blockchain;
};

/*
  get url suffix from default network and generate url for selected network
  regex source: https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s12.html
*/
export const getBlockExplorerUrl = (url: string) =>
    url.match(/^([a-z][a-z0-9+\-.]*:(\/\/[^/?#]+)?)?([a-z0-9\-._~%!$&'()*+,;=:@/]*)/)!.pop();

const initialStatePredefined: Partial<BlockchainState> = {};

// fill initial state, those values will be changed by BLOCKCHAIN.UPDATE_FEE action
export const initialState = NETWORKS.reduce((state, network) => {
    if (network.accountType) return state;
    state[network.symbol] = {
        connected: false,
        explorer: network.explorer,
        blockHash: '0',
        blockHeight: 0,
        version: '0',
    };
    return state;
}, initialStatePredefined as BlockchainState);

const connect = (draft: Draft<BlockchainState>, info: BlockchainInfo) => {
    const network = getNetwork(info.coin.shortcut.toLowerCase());
    if (!network) return;

    draft[network.symbol] = {
        url: info.url,
        explorer: {
            tx: `${info.url}${getBlockExplorerUrl(network.explorer.tx)}`,
            account: `${info.url}${getBlockExplorerUrl(network.explorer.account)}`,
        },
        connected: true,
        blockHash: info.blockHash,
        blockHeight: info.blockHeight,
        version: info.version,
    };
    delete draft[network.symbol].error;
    delete draft[network.symbol].reconnection;
};

const error = (draft: Draft<BlockchainState>, symbol: string, error: string) => {
    const network = getNetwork(symbol.toLowerCase());
    if (!network) return;

    draft[network.symbol] = {
        ...draft[network.symbol],
        connected: false,
        explorer: network.explorer,
        error,
    };
    delete draft[network.symbol].url;
};

const update = (draft: Draft<BlockchainState>, block: BlockchainBlock) => {
    const network = getNetwork(block.coin.shortcut.toLowerCase());
    if (!network) return;

    draft[network.symbol] = {
        ...draft[network.symbol],
        blockHash: block.blockHash,
        blockHeight: block.blockHeight,
    };
};

const blockchainReducer = (state: BlockchainState = initialState, action: Action) =>
    produce(state, draft => {
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
            case BLOCKCHAIN.RECONNECT_TIMEOUT_START:
                draft[action.payload.symbol] = {
                    ...draft[action.payload.symbol],
                    reconnection: {
                        id: action.payload.id,
                        time: action.payload.time,
                        count: action.payload.count,
                    },
                };
                break;
            // no default
        }
    });

export default blockchainReducer;
