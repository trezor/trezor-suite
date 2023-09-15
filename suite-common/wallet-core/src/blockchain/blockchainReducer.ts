import { PayloadAction } from '@reduxjs/toolkit';
import { memoizeWithArgs } from 'proxy-memoize';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';
import { BackendType, BlockchainNetworks } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import {
    BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS,
    BlockchainBlock,
    BlockchainError,
    BlockchainInfo,
} from '@trezor/connect';

import { blockchainActions } from './blockchainActions';

/*
  get url suffix from default network and generate url for selected network
  regex source: https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s12.html
*/
export const getBlockExplorerUrlSuffix = (url: string) =>
    url.match(/^([a-z][a-z0-9+\-.]*:(\/\/[^/?#]+)?)?([a-z0-9\-._~%!$&'()*+,;=:@/]*)/)!.pop();

export const isHttpProtocol = (url: string) => /^https?:\/\//.test(url);

export type BlockchainState = BlockchainNetworks;

const initialStatePredefined: Partial<BlockchainState> = {};

export type BlockchainRootState = { wallet: { blockchain: BlockchainState } };

// fill initial state, those values will be changed by BLOCKCHAIN.UPDATE_FEE action
export const blockchainInitialState: BlockchainNetworks = networksCompatibility.reduce(
    (state, network) => {
        if (network.accountType) return state;
        state[network.symbol] = {
            connected: false,
            explorer: network.explorer,
            blockHash: '0',
            blockHeight: 0,
            version: '0',
            backends:
                network.symbol === 'regtest'
                    ? {
                          selected: 'blockbook',
                          urls: {
                              blockbook: ['http://localhost:19121'],
                          },
                      }
                    : {},
        };
        return state;
    },
    initialStatePredefined as BlockchainState,
);

const connect = (draft: BlockchainState, info: BlockchainInfo) => {
    const network = getNetwork(info.coin.shortcut.toLowerCase());
    if (!network) return;

    const isHttp = isHttpProtocol(info.url); // can use dynamic backend url settings

    draft[network.symbol] = {
        url: info.url,
        explorer: {
            tx: `${
                isHttp
                    ? info.url + getBlockExplorerUrlSuffix(network.explorer.tx)
                    : network.explorer.tx
            }`,
            account: `${
                isHttp
                    ? info.url + getBlockExplorerUrlSuffix(network.explorer.account)
                    : network.explorer.account
            }`,
        },
        connected: true,
        blockHash: info.blockHash,
        blockHeight: info.blockHeight,
        version: info.version,
        backends: draft[network.symbol].backends,
    };

    delete draft[network.symbol].error;
    delete draft[network.symbol].reconnection;
};

const error = (draft: BlockchainState, symbol: string, error: string) => {
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

const update = (draft: BlockchainState, block: BlockchainBlock) => {
    const network = getNetwork(block.coin.shortcut.toLowerCase());
    if (!network) return;

    draft[network.symbol] = {
        ...draft[network.symbol],
        blockHash: block.blockHash,
        blockHeight: block.blockHeight,
    };
};

export const prepareBlockchainReducer = createReducerWithExtraDeps(
    blockchainInitialState,
    (builder, extra) => {
        builder

            .addCase(blockchainActions.reconnectTimeoutStart, (state, action) => {
                state[action.payload.symbol] = {
                    ...state[action.payload.symbol],
                    reconnection: {
                        id: action.payload.id,
                        time: action.payload.time,
                        count: action.payload.count,
                    },
                };
            })
            .addCase(blockchainActions.synced, (state, action) => {
                state[action.payload.symbol].syncTimeout = action.payload.timeout;
            })
            .addCase(blockchainActions.setBackend, (state, action) => {
                const { coin, type } = action.payload;
                if (type === 'default') {
                    delete state[coin].backends.selected;
                } else if (!action.payload.urls.length) {
                    delete state[coin].backends.selected;
                    delete state[coin].backends.urls?.[type as BackendType];
                } else {
                    state[coin].backends.selected = type as BackendType;
                    state[coin].backends.urls = {
                        ...state[coin].backends.urls,
                        [type as BackendType]: action.payload.urls,
                    };
                }
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadBlockchain)
            .addMatcher(
                action => action.type === TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT,
                (state, { payload }: PayloadAction<BlockchainInfo>) => {
                    connect(state, payload);
                },
            )
            .addMatcher(
                action => action.type === TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.ERROR,
                (state, { payload }: PayloadAction<BlockchainError>) => {
                    error(state, payload.coin.shortcut, payload.error);
                },
            )
            .addMatcher(
                action => action.type === TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK,
                (state, { payload }: PayloadAction<BlockchainBlock>) => {
                    update(state, payload);
                },
            );
    },
);

export const selectBlockchainState = (state: BlockchainRootState) => state.wallet.blockchain;
export const selectNetworkBlockchainInfo =
    (networkSymbol: NetworkSymbol) => (state: BlockchainRootState) =>
        state.wallet.blockchain[networkSymbol];

export const selectBlockchainHeightBySymbol = memoizeWithArgs(
    (state: BlockchainRootState, symbol: NetworkSymbol) => {
        const blockchain = selectNetworkBlockchainInfo(symbol)(state);
        return blockchain.blockHeight;
    },
);

export const selectBlockchainExplorerBySymbol = memoizeWithArgs(
    (state: BlockchainRootState, symbol?: NetworkSymbol) => {
        if (!symbol) return null;
        const blockchain = selectNetworkBlockchainInfo(symbol)(state);
        return blockchain.explorer;
    },
    { size: 100 },
);
