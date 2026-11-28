import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { asGetter } from '@trezor/dependency-injection';
import { createMockDispatch, mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';
import {
    type InitBlockchainThunkDeps,
    type InitBlockchainThunkState,
    type SetCustomBackendThunkState,
    initBlockchainThunk,
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

const initStore = (enabledNetworks: NetworkSymbol[]) =>
    createTestCompositionRoot<void, SetCustomBackendThunkState>({
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
                },
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks,
                },
            },
        },
    }).services.store;

describe(setCustomBackendThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('requests a connection after applying a custom backend', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorBlockchain, 'setCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorBlockchain, 'unsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore([asNetworkSymbol('btc')]);

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
            .spyOn(TrezorBlockchain, 'setCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorBlockchain, 'unsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore([]);

        await store.dispatch(setCustomBackendThunk(asNetworkSymbol('btc')));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).not.toHaveBeenCalled();
    });
});

describe('initBlockchainThunk', () => {
    afterEach(() => jest.restoreAllMocks());

    it('connects the backends of funded networks first', async () => {
        // The balance report after init is debounced; it must not fire after the test.
        jest.useFakeTimers();
        const reconnect = jest
            .spyOn(TrezorBlockchain, 'unsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const account = (symbol: string, balance: string) =>
            mockWalletAccount({
                symbol: asNetworkSymbol(symbol),
                descriptor: asAccountDescriptor(`${symbol}${balance}`),
                balance,
            });
        const state: InitBlockchainThunkState = {
            wallet: {
                accounts: [
                    account('btc', '0'),
                    account('eth', '0'),
                    account('ltc', '5'),
                    account('eth', '7'),
                    account('doge', '0'),
                ],
                blockchain: blockchainInitialState,
                settings: initialWalletSettingsState,
            },
            networks: mockNetworksState(['btc', 'eth', 'ltc', 'doge'].map(asNetworkSymbol)),
        };
        const extra: InitBlockchainThunkDeps = {
            services: {
                analytics: mockAnalytics<AnalyticsSharedEvents>(),
                getDebugSettings: asGetter(() => ({})),
            },
        };
        const { dispatch } = createMockDispatch({ getState: () => state, extra });

        await dispatch(initBlockchainThunk()).unwrap();

        expect(reconnect.mock.calls.map(([params]) => params.coin)).toEqual([
            'eth',
            'ltc',
            'btc',
            'doge',
        ]);
        jest.useRealTimers();
    });
});
