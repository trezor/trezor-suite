import { type PayloadAction } from '@reduxjs/toolkit';

import {
    type NetworkMetadata,
    type NetworksRootState,
    networksActions,
    selectSupportedNetworkSymbols,
} from '@suite-common/networks';
import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
    createWeakMapSelector,
} from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Blockchain, type BlockchainNetworks } from '@suite-common/wallet-types';
import { getCustomBackends } from '@suite-common/wallet-utils';
import {
    type BlockchainBlock,
    type BlockchainError,
    type BlockchainInfo,
    type BlockchainReconnecting,
    BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS,
} from '@trezor/connect';

import { blockchainActions } from './blockchainActions';
import {
    type WalletSettingsRootState,
    selectEnabledNetworks,
} from '../settings/walletSettingsReducer';

export type BlockchainState = BlockchainNetworks;

export type BlockchainRootState = { wallet: { blockchain: BlockchainState } };

export const createBlockchainInitialState = (
    networkConfigs: readonly NetworkMetadata[],
): BlockchainState =>
    Object.fromEntries(
        networkConfigs.map(network => [
            network.symbol,
            {
                connected: false,
                blockHash: '0',
                blockHeight: 0,
                version: '0',
                backends:
                    network.symbol === 'regtest'
                        ? { selected: 'blockbook', urls: { blockbook: ['http://localhost:19121'] } }
                        : {},
            },
        ]),
    ) as BlockchainState;

export const blockchainInitialState = {} as BlockchainState;

const writeIdentityConnection = (
    state: BlockchainState,
    symbol: NetworkSymbol,
    identity: string,
    data: Partial<NonNullable<Blockchain['identityConnections']>[string]>,
) => {
    const blockchain = state[symbol];
    const connections = blockchain.identityConnections ?? (blockchain.identityConnections = {});
    connections[identity] = {
        ...(connections[identity] ?? { connected: false }),
        ...data,
    };
};

const connect = (draft: BlockchainState, info: BlockchainInfo) => {
    const symbol = info.coin.shortcut.toLowerCase() as NetworkSymbol;
    if (!Object.hasOwn(draft, symbol)) return;

    if (info.identity) {
        writeIdentityConnection(draft, symbol, info.identity, {
            connected: true,
            error: undefined,
            reconnectionTime: undefined,
        });

        return;
    }

    draft[symbol] = {
        url: info.url,
        connected: true,
        blockHash: info.blockHash,
        blockHeight: info.blockHeight,
        version: info.version,
        backends: draft[symbol].backends,
        identityConnections: draft[symbol].identityConnections,
    };
};

const error = (draft: BlockchainState, payload: BlockchainError) => {
    const {
        error,
        identity,
        coin: { shortcut: symbol },
    } = payload;
    const networkSymbol = symbol.toLowerCase() as NetworkSymbol;
    if (!Object.hasOwn(draft, networkSymbol)) return;

    if (identity) {
        writeIdentityConnection(draft, networkSymbol, identity, { connected: false, error });
    } else {
        draft[networkSymbol] = {
            ...draft[networkSymbol],
            connected: false,
            error,
        };
        delete draft[networkSymbol].url;
    }
};

const update = (draft: BlockchainState, block: BlockchainBlock) => {
    const symbol = block.coin.shortcut.toLowerCase() as NetworkSymbol;
    if (!Object.hasOwn(draft, symbol)) return;

    draft[symbol] = {
        ...draft[symbol],
        blockHash: block.blockHash,
        blockHeight: block.blockHeight,
    };
};

const reconnecting = (draft: BlockchainState, payload: BlockchainReconnecting) => {
    const symbol = payload.coin.shortcut.toLowerCase() as NetworkSymbol;
    if (!Object.hasOwn(draft, symbol)) return;

    if (payload.identity) {
        writeIdentityConnection(draft, symbol, payload.identity, {
            reconnectionTime: payload.time,
        });
    } else {
        draft[symbol] = {
            ...draft[symbol],
            reconnectionTime: payload.time,
        };
    }
};

export type BlockchainReducerDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadBlockchain'>;

export const prepareBlockchainReducer = createReducerWithExtraDeps(
    blockchainInitialState,
    (builder, extra: BlockchainReducerDeps) => {
        builder
            .addCase(networksActions.setNetworks, (state, action) => {
                const initialNetworks = createBlockchainInitialState(action.payload);
                action.payload.forEach(network => {
                    state[network.symbol] ??= initialNetworks[network.symbol];
                });
            })
            .addCase(blockchainActions.synced, (state, action) => {
                state[action.payload.symbol].syncTimeout = action.payload.timeout;
            })
            .addCase(blockchainActions.setBackend, (state, action) => {
                const { symbol, type } = action.payload;
                if (type === 'default') {
                    delete state[symbol].backends.selected;
                } else if (!action.payload.urls.length) {
                    delete state[symbol].backends.selected;
                    delete state[symbol].backends.urls?.[type];
                } else {
                    state[symbol].backends.selected = type;
                    state[symbol].backends.urls = {
                        ...state[symbol].backends.urls,
                        [type]: action.payload.urls,
                    };
                }
            })
            .addCase(blockchainActions.setBackendGapLimit, (state, action) => {
                const { symbol, gapLimit } = action.payload;
                if (gapLimit === undefined) {
                    delete state[symbol].backends.gapLimit;
                } else {
                    state[symbol].backends.gapLimit = gapLimit;
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
                    error(state, payload);
                },
            )
            .addMatcher(
                action => action.type === TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.RECONNECTING,
                (state, { payload }: PayloadAction<BlockchainReconnecting>) => {
                    reconnecting(state, payload);
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

const createMemoizedSelector = createWeakMapSelector.withTypes<
    BlockchainRootState & WalletSettingsRootState
>();

export const selectBlockchainState = (state: BlockchainRootState) => state.wallet.blockchain;

export const selectNetworkBlockchainInfo = (state: BlockchainRootState, symbol: NetworkSymbol) =>
    state.wallet.blockchain[symbol];

export const selectBlockchainHeightBySymbol = createMemoizedSelector(
    [selectNetworkBlockchainInfo],
    blockchain => blockchain?.blockHeight ?? null,
);

export const selectBlockchainBlockInfoBySymbol = createMemoizedSelector(
    [selectNetworkBlockchainInfo],
    blockchain => ({
        blockhash: blockchain.blockHash,
        blockHeight: blockchain.blockHeight,
    }),
);

export const selectBlockchainBackendType = createMemoizedSelector(
    [selectNetworkBlockchainInfo],
    blockchain => blockchain.backends.selected,
);

export const selectIsCustomBackendConfigured = createMemoizedSelector(
    [selectBlockchainBackendType],
    backendType => !!backendType,
);

export const selectGapLimit = (state: BlockchainRootState, symbol: NetworkSymbol) =>
    state.wallet.blockchain[symbol]?.backends.gapLimit;

const createNetworkMemoizedSelector = createWeakMapSelector.withTypes<
    BlockchainRootState & WalletSettingsRootState & NetworksRootState
>();

export const selectCustomBackends = createWeakMapSelector.withTypes<
    BlockchainRootState & NetworksRootState
>()([selectBlockchainState, selectSupportedNetworkSymbols], (blockchainState, supportedNetworks) =>
    getCustomBackends(blockchainState, supportedNetworks),
);

export const selectEnabledCustomBackends = createNetworkMemoizedSelector(
    [selectCustomBackends, selectEnabledNetworks],
    (customBackends, enabledNetworks) =>
        customBackends
            .map(({ symbol }) => symbol)
            .filter(symbol => enabledNetworks.includes(symbol)),
);
