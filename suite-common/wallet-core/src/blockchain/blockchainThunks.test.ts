import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';
import { setCustomBackendThunk } from './blockchainThunks';

const blockchainReducer = prepareBlockchainReducer(extraDependenciesCommonMock);
const electrumUrl = '127.0.0.1:50001:t';

const initStore = () =>
    configureMockStore({
        reducer: combineReducers({
            wallet: combineReducers({
                blockchain: blockchainReducer,
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
            .mockResolvedValue({ success: true, payload: true });
        const store = initStore();

        await store.dispatch(setCustomBackendThunk('btc'));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).toHaveBeenCalledWith({ coin: 'btc', identity: undefined });
        expect(setCustomBackend.mock.invocationCallOrder[0]).toBeLessThan(
            reconnect.mock.invocationCallOrder[0],
        );
    });
});
