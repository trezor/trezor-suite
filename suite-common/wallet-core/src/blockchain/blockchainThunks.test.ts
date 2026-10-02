import { combineReducers } from '@reduxjs/toolkit';

import { asGetter, mock } from '@suite-common/dependency-injection';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import type { CustomBackend, GetAnonRpcSettingsDep } from '@suite-common/wallet-types';
import TrezorConnect, { type BlockchainLinkAnonRpc } from '@trezor/connect';

import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';
import {
    type SetCustomBackendThunkDeps,
    type SetCustomBackendThunkState,
    setCustomBackendThunk,
} from './blockchainThunks';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../settings/walletSettingsReducer';

const blockchainReducer = prepareBlockchainReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadBlockchain: mockReducer() },
});
const walletSettingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});

const electrumUrl = '127.0.0.1:50001:t';
const evmRpcUrl = 'https://eth-rpc.example';

const anonRpc: BlockchainLinkAnonRpc = {
    specifier: '0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e',
    bootstrapRpcUrl: evmRpcUrl,
    config: { gateways: ['127.0.0.1:1:certhash'] },
};

type InitStoreParams = {
    enabledNetworks: NetworkSymbol[];
    getAnonRpcSettings?: GetAnonRpcSettingsDep['getAnonRpcSettings'];
};

const initStore = ({
    enabledNetworks,
    getAnonRpcSettings = asGetter(() => undefined),
}: InitStoreParams) =>
    createTestCompositionRoot<SetCustomBackendThunkDeps, SetCustomBackendThunkState>({
        reducer: combineReducers({
            wallet: combineReducers({
                blockchain: blockchainReducer,
                settings: walletSettingsReducer,
            }),
        }),
        preloadedState: {
            wallet: {
                blockchain: {
                    ...blockchainInitialState,
                    btc: {
                        ...blockchainInitialState.btc,
                        backends: {
                            selected: 'electrum' as const,
                            urls: { electrum: [electrumUrl] },
                        },
                    },
                    eth: {
                        ...blockchainInitialState.eth,
                        backends: {
                            selected: 'evm-rpc' as const,
                            urls: { 'evm-rpc': [evmRpcUrl] },
                        },
                    },
                },
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks,
                },
            },
        },
        services: () => ({ getAnonRpcSettings }),
    }).services.store;

describe(setCustomBackendThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('requests a connection after applying a custom backend', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore({ enabledNetworks: [asNetworkSymbol('btc')] });

        await store.dispatch(setCustomBackendThunk(asNetworkSymbol('btc')));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).toHaveBeenCalledWith({ coin: 'btc', identity: undefined });
        const setCustomBackendOrder =
            setCustomBackend.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY;
        const reconnectOrder = reconnect.mock.invocationCallOrder[0] ?? Number.NEGATIVE_INFINITY;
        expect(setCustomBackendOrder).toBeLessThan(reconnectOrder);
    });

    it('applies the custom backend of a disabled network without connecting to it', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore({ enabledNetworks: [] });

        await store.dispatch(setCustomBackendThunk(asNetworkSymbol('btc')));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).not.toHaveBeenCalled();
    });
    it('routes a custom backend through anon-rpc when the app asks for it', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        jest.spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates').mockResolvedValue({
            success: true,
            payload: { subscribed: false },
        });
        const getAnonRpcSettings = mock<(backend: CustomBackend) => BlockchainLinkAnonRpc>(
            () => anonRpc,
        );
        const store = initStore({
            enabledNetworks: [asNetworkSymbol('eth')],
            getAnonRpcSettings: asGetter(getAnonRpcSettings),
        });

        await store.dispatch(setCustomBackendThunk(asNetworkSymbol('eth')));

        expect(getAnonRpcSettings).toHaveBeenCalledWith({
            symbol: 'eth',
            type: 'evm-rpc',
            urls: [evmRpcUrl],
        });
        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'eth',
            blockchainLink: { type: 'evm-rpc', url: [evmRpcUrl], anonRpc },
        });
    });
});
