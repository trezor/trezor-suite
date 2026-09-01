import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';
import { setCustomBackendThunk } from './blockchainThunks';
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
    configureMockStore({
        extra: undefined,
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
    });

describe(setCustomBackendThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('requests a connection after applying a custom backend', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore(['btc']);

        await store.dispatch(setCustomBackendThunk('btc'));

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
        const store = initStore([]);

        await store.dispatch(setCustomBackendThunk('btc'));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).not.toHaveBeenCalled();
    });
});
