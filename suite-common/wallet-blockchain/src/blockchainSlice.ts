import { createAction, PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDependencies, matchesActionType } from '@suite-common/redux-utils';
import { networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';
import {
    BackendSettings,
    BlockchainNetworks,
    CustomBackend,
    FeeInfo,
} from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import {
    BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS,
    BlockchainBlock,
    BlockchainInfo,
} from '@trezor/connect';
import { Timeout } from '@trezor/type-utils';

import { modulePrefix } from './constants';

export type BlockchainSliceState = BlockchainNetworks;
export type BlockchainSliceRootState = {
    wallet: {
        blockchain: BlockchainSliceState;
    };
};

/*
  get url suffix from default network and generate url for selected network
  regex source: https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s12.html
*/
const getBlockExplorerUrlSuffix = (url: string) =>
    url.match(/^([a-z][a-z0-9+\-.]*:(\/\/[^/?#]+)?)?([a-z0-9\-._~%!$&'()*+,;=:@/]*)/)!.pop();

const isHttpProtocol = (url: string) => /^https?:\/\//.test(url);

// fill initial state, those values will be changed by BLOCKCHAIN.UPDATE_FEE action
export const initialState = networksCompatibility.reduce((state, network) => {
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
}, {} as BlockchainSliceState);

const connect = (draft: BlockchainSliceState, info: BlockchainInfo) => {
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

const error = (draft: BlockchainSliceState, symbol: string, error: string) => {
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

const update = (draft: BlockchainSliceState, block: BlockchainBlock) => {
    const network = getNetwork(block.coin.shortcut.toLowerCase());
    if (!network) return;

    draft[network.symbol] = {
        ...draft[network.symbol],
        blockHash: block.blockHash,
        blockHeight: block.blockHeight,
    };
};

const updateFee = createAction<
    Partial<{
        [key in NetworkSymbol]: FeeInfo;
    }>
>(`${modulePrefix}/updateFee`);

const connected = createAction<NetworkSymbol>(`${modulePrefix}/connected`);

type ReconnectTimeoutStartPayload = {
    symbol: NetworkSymbol;
    id: Timeout;
    time: number;
    count: number;
};
type SetBackendPayload =
    | CustomBackend
    | {
          coin: NetworkSymbol;
          type: 'default';
      };

const blockchainSlice = createSliceWithExtraDependencies({
    name: modulePrefix,
    initialState,
    reducers: {
        reconnectTimeoutStart: (
            state,
            { payload }: PayloadAction<ReconnectTimeoutStartPayload>,
        ) => {
            state[payload.symbol] = {
                ...state[payload.symbol],
                reconnection: {
                    id: payload.id,
                    time: payload.time,
                    count: payload.count,
                },
            };
        },
        synced: (
            state,
            { payload }: PayloadAction<{ symbol: NetworkSymbol; timeout: Timeout }>,
        ) => {
            state[payload.symbol].syncTimeout = payload.timeout;
        },
        setBackend: (state, { payload }: PayloadAction<SetBackendPayload>) => {
            const { coin, type } = payload;
            if (type === 'default') {
                delete state[coin].backends.selected;
            } else if (!payload.urls.length) {
                delete state[coin].backends.selected;
                delete state[coin].backends.urls?.[type];
            } else {
                state[coin].backends.selected = type;
                state[coin].backends.urls = {
                    ...state[coin].backends.urls,
                    [type]: payload.urls,
                };
            }
        },
    },
    extraReducers: (builder, extra) => {
        builder
            .addCase(extra.actions.notificationsAddEvent, (state, action) => {})
            .addMatcher(
                matchesActionType(extra.actionTypes.storageLoad),
                extra.reducers.storageLoadBlockchain,
            )
            .addMatcher(
                matchesActionType(TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT),
                (state, { payload }: PayloadAction<BlockchainInfo>) => {
                    connect(state, payload);
                },
            )
            .addMatcher(
                matchesActionType(TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.ERROR),
                (state, { payload }: PayloadAction<{ symbol: string; error: string }>) => {
                    error(state, payload.symbol, payload.error);
                },
            )
            .addMatcher(
                matchesActionType(TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK),
                (state, { payload }: PayloadAction<BlockchainBlock>) => {
                    update(state, payload);
                },
            );
    },
});

export const blockchainActions = {
    ...blockchainSlice.actions,
    updateFee,
    connected,
};
export const prepareBlockchainReducer = blockchainSlice.prepareReducer;

export const selectNetworks = (state: BlockchainSliceRootState) => state.wallet.blockchain;

export const selectNetwork = (networkSymbol: NetworkSymbol) => (state: BlockchainSliceRootState) =>
    state.wallet.blockchain[networkSymbol];

export const selectNetworkBackends =
    (networkSymbol: NetworkSymbol) => (state: BlockchainSliceRootState) =>
        selectNetwork(networkSymbol)(state).backends;

export const selectNetworkSyncTimeout =
    (networkSymbol: NetworkSymbol) => (state: BlockchainSliceRootState) =>
        selectNetwork(networkSymbol)(state).syncTimeout;
