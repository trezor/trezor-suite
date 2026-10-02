import { combineReducers } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';
import {
    type SuiteSettingsRootState,
    prepareSuiteSettingsReducer,
    selectHasExperimentalFeature,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '@suite/settings';
import { toGetter } from '@suite-common/dependency-injection';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type SetCustomBackendThunkDeps,
    type SetCustomBackendThunkState,
    blockchainInitialState,
    initialWalletSettingsState,
    prepareBlockchainReducer,
    prepareWalletSettingsReducer,
} from '@suite-common/wallet-core';
import type { CustomBackend } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { getAnonRpcSettings } from 'src/utils/wallet/anonRpcUtils';

import { anonRpcMiddleware } from './anonRpcMiddleware';

const evmRpcUrl = 'https://eth-rpc.example';

type State = SetCustomBackendThunkState & SuiteSettingsRootState;

const initStore = (experimental: ExperimentalFeature[] | undefined) =>
    createTestCompositionRoot<SetCustomBackendThunkDeps, State>({
        reducer: combineReducers({
            suiteSettings: prepareSuiteSettingsReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
                reducers: { storageLoadSuiteSettings: mockReducer() },
            }),
            wallet: combineReducers({
                blockchain: prepareBlockchainReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadBlockchain: mockReducer() },
                }),
                settings: prepareWalletSettingsReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadWalletSettings: mockReducer() },
                }),
            }),
        }),
        preloadedState: {
            suiteSettings: { ...suiteSettingsInitialState, experimental },
            wallet: {
                blockchain: {
                    ...blockchainInitialState,
                    eth: {
                        ...blockchainInitialState.eth,
                        backends: { selected: 'evm-rpc', urls: { 'evm-rpc': [evmRpcUrl] } },
                    },
                },
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks: [asNetworkSymbol('eth')],
                },
            },
        },
        middleware: [anonRpcMiddleware],
        // The same getter the Suite composition root provides.
        services: store => ({
            getAnonRpcSettings: toGetter(store.getState, (state: State, backend: CustomBackend) =>
                getAnonRpcSettings({
                    backend,
                    isAnonRpcEnabled: selectHasExperimentalFeature('anon-rpc')(state),
                }),
            ),
        }),
    }).services.store;

// The re-push runs in a thunk that the middleware does not await.
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('anonRpcMiddleware', () => {
    let setCustomBackend: jest.SpyInstance;

    beforeEach(() => {
        setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        jest.spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates').mockResolvedValue({
            success: true,
            payload: { subscribed: false },
        });
    });

    afterEach(() => {
        // Connect is mocked for the whole suite, so its call history outlives a single test.
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('hands the Ethereum backend to Connect with anon-rpc once the feature is on', async () => {
        const store = initStore([]);

        store.dispatch(suiteSettingsActions.setExperimentalFeatures(['anon-rpc']));
        await settle();

        expect(setCustomBackend).toHaveBeenCalledTimes(1);
        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'eth',
            blockchainLink: {
                type: 'evm-rpc',
                url: [evmRpcUrl],
                anonRpc: expect.objectContaining({ bootstrapRpcUrl: evmRpcUrl }),
            },
        });
    });

    it.each<[string, ExperimentalFeature[] | undefined]>([
        ['the feature is turned off', []],
        ['experimental features are switched off', undefined],
    ])('hands it over without anon-rpc once %s', async (_, experimental) => {
        const store = initStore(['anon-rpc']);

        store.dispatch(suiteSettingsActions.setExperimentalFeatures(experimental));
        await settle();

        expect(setCustomBackend).toHaveBeenCalledTimes(1);
        expect(setCustomBackend.mock.calls[0]?.[0].blockchainLink.anonRpc).toBeUndefined();
    });

    it('leaves Connect alone when another experimental feature changes', async () => {
        const store = initStore(['anon-rpc']);

        store.dispatch(suiteSettingsActions.setExperimentalFeatures(['anon-rpc', 'slip24']));
        await settle();

        expect(setCustomBackend).not.toHaveBeenCalled();
    });
});
