import { createMemoryHistory } from 'history';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { prepareFlagsReducer } from '@suite/flags';
import { lockDevice, lockRouter, locksInitialState, locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { modalReducer, openModal } from '@suite/modal';
import type { GotoThunkDeps, PathString } from '@suite/router';
import {
    createSuiteRouterHistory,
    gotoThunk,
    initialRedirectionThunk,
    onLocationChangeThunk,
    routerAppChanged,
    routerInitThunk,
    routerLocationChange,
    routerMiddleware,
    routerReducer,
    selectRouteName,
} from '@suite/router';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '@suite/settings';
import { onSuiteInit, onSuiteReady } from '@suite/suite-lifecycle';
import { type ConnectInitThunkDeps, connectInitThunk } from '@suite-common/connect-init';
import {
    mockConnectInitDeviceEventHooks,
    mockConnectInitSettings,
    mockConnectInitUIEventHooks,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { connectPopupInitialState } from '@suite-common/connect-popup';
import { prepareDeviceReducer } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import {
    fetchConfigThunk,
    initMessageSystemThunk,
    messageSystemActions,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { validJws } from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { mockGetAllowPrerelease, mockGetBinFilesBaseUrl } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type InitTokenDefinitionsThunkDeps,
    initTokenDefinitionsThunk,
    periodicCheckTokenDefinitionsThunk,
    tokenDefinitionsInitialState,
} from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import {
    type InitBlockchainThunkDeps,
    type PeriodicFetchFiatRatesThunkDeps,
    feesActions,
    fetchFiatRatesThunk,
    initBlockchainThunk,
    initDevicesThunk,
    initStakeDataThunk,
    periodicCheckStakeDataThunk,
    periodicFetchFiatRatesThunk,
    preloadFeeInfoThunk,
    stakeDataActions,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    type WalletConnectInitThunkDeps,
    walletConnectInitThunk,
    walletConnectInitialState,
} from '@suite-common/walletconnect';
import TrezorConnect from '@trezor/connect';
import { asGetter, mock } from '@trezor/dependency-injection';
import { noopCreateLogger } from '@trezor/logger';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { SUITE } from 'src/actions/suite/constants';
import {
    type InitThunkDesktopApiDep,
    type InitThunkState,
    initThunk,
} from 'src/actions/suite/initAction';
import { BACKENDS_INIT_TIMEOUT_MS, BACKENDS_POLL_INTERVAL_MS } from 'src/constants/suite/backends';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { walletReducers } from 'src/reducers/wallet';

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});
const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const flagsReducer = prepareFlagsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFlags: mockReducer() },
});
const suiteSettingsReducer = prepareSuiteSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadSuiteSettings: mockReducer() },
});

global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        text: () => Promise.resolve(validJws),
    }),
);

const EMPTY_ACTION = { type: 'foo' } as any;

const getInitialState = (): InitThunkState => ({
    networks: mockNetworksState(mockGetSupportedNetworks()),
    suite: suiteReducer(undefined, EMPTY_ACTION),
    suiteSettings: suiteSettingsInitialState,
    flags: flagsReducer(undefined, EMPTY_ACTION),
    locks: locksInitialState,
    router: routerReducer(undefined, EMPTY_ACTION),
    modal: modalReducer(undefined, EMPTY_ACTION),
    wallet: walletReducers(undefined, EMPTY_ACTION),
    messageSystem: messageSystemReducer(undefined, EMPTY_ACTION),
    tokenDefinitions: tokenDefinitionsInitialState,
    connectPopup: connectPopupInitialState,
    walletConnect: walletConnectInitialState,
    device: deviceReducer(undefined, EMPTY_ACTION),
    metadata: metadataReducer(undefined, EMPTY_ACTION),
    firmware: firmwareInitialState,
});

type Fixture = {
    description: string;
    actions: string[];
    options: {
        initialPath?: string;
        expectedApp?: InitThunkState['router']['app'];
        trezorConnectError?: string;
    };
};

const fixtures: Fixture[] = [
    {
        description: 'Successful normal run',
        options: {
            initialPath: '/accounts',
            expectedApp: 'wallet',
        },
        actions: [
            onSuiteInit.type,
            initDevicesThunk.pending.type,
            initDevicesThunk.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirectionThunk.pending.type,
            connectInitThunk.pending.type,
            initialRedirectionThunk.fulfilled.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            feesActions.updateMultipleFees.type,
            preloadFeeInfoThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            periodicCheckTokenDefinitionsThunk.pending.type,
            initTokenDefinitionsThunk.pending.type,
            initTokenDefinitionsThunk.fulfilled.type,
            periodicCheckTokenDefinitionsThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.fulfilled.type,
            updateMissingTxFiatRatesThunk.pending.type,
            updateMissingTxFiatRatesThunk.fulfilled.type,
            routerInitThunk.pending.type,
            onLocationChangeThunk.pending.type,
            routerLocationChange.type,
            routerAppChanged.type,
            periodicCheckStakeDataThunk.pending.type,
            initStakeDataThunk.pending.type,
            stakeDataActions.fetchStakeDataRequest.type,
            walletConnectInitThunk.pending.type,
            onSuiteReady.type,
        ],
    },
    {
        description: 'Successful non-existent path',
        options: {
            initialPath: '/foo-bar',
            expectedApp: 'unknown',
        },
        actions: [
            onSuiteInit.type,
            initDevicesThunk.pending.type,
            initDevicesThunk.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirectionThunk.pending.type,
            connectInitThunk.pending.type,
            initialRedirectionThunk.fulfilled.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            feesActions.updateMultipleFees.type,
            preloadFeeInfoThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            periodicCheckTokenDefinitionsThunk.pending.type,
            initTokenDefinitionsThunk.pending.type,
            initTokenDefinitionsThunk.fulfilled.type,
            periodicCheckTokenDefinitionsThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.pending.type,
            fetchFiatRatesThunk.fulfilled.type,
            periodicFetchFiatRatesThunk.fulfilled.type,
            updateMissingTxFiatRatesThunk.pending.type,
            updateMissingTxFiatRatesThunk.fulfilled.type,
            routerInitThunk.pending.type,
            onLocationChangeThunk.pending.type,
            routerLocationChange.type,
            periodicCheckStakeDataThunk.pending.type,
            initStakeDataThunk.pending.type,
            stakeDataActions.fetchStakeDataRequest.type,
            walletConnectInitThunk.pending.type,
            onSuiteReady.type,
        ],
    },
    {
        description: 'TrezorConnect.init throws',
        options: {
            trezorConnectError: 'is broken',
            initialPath: '/version',
            expectedApp: 'version',
        },
        actions: [
            onSuiteInit.type,
            initDevicesThunk.pending.type,
            initDevicesThunk.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirectionThunk.pending.type,
            gotoThunk.pending.type,
            onLocationChangeThunk.pending.type,
            routerLocationChange.type,
            routerAppChanged.type,
            lockRouter.type,
            connectInitThunk.pending.type,
            onLocationChangeThunk.fulfilled.type,
            gotoThunk.fulfilled.type,
            initialRedirectionThunk.fulfilled.type,
            connectInitThunk.rejected.type,
            SUITE.ERROR,
        ],
    },
];

const createDesktopApiDep = (): InitThunkDesktopApiDep => ({
    desktopApi: {
        setAutomaticUpdateEnabled: mock(),
        getBioAuthSettings: mock(() => Promise.resolve({ enabled: false })),
        getBioAuthStatus: mock(() => Promise.resolve(false)),
        isBioAuthAvailable: mock(() => Promise.resolve(false)),
        on: mock(),
    },
});

type InitActionTestDeps = ConnectInitThunkDeps &
    GotoThunkDeps &
    InitBlockchainThunkDeps &
    InitTokenDefinitionsThunkDeps &
    PeriodicFetchFiatRatesThunkDeps &
    WalletConnectInitThunkDeps &
    WithServices<InitThunkDesktopApiDep>;

const initStore = (state: InitThunkState) => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });
    const { services } = createTestCompositionRoot<InitActionTestDeps, InitThunkState>({
        services: store => ({
            ...createDesktopApiDep(),
            analytics: mockDesktopAnalytics(),
            connectInitDeviceEventHooks: mockConnectInitDeviceEventHooks(),
            connectInitSettings: mockConnectInitSettings(),
            connectInitUIEventHooks: mockConnectInitUIEventHooks(),
            createLogger: noopCreateLogger,
            createTransports: mockCreateTransports(),
            getAllowPrerelease: mockGetAllowPrerelease(),
            getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
            getDebugSettings: mockGetDebugSettings(),
            getIsWindowVisible: asGetter(() => true),
            getThpSettings: mockGetThpSettings(),
            getTokenDefinitionsEnabledNetworks: asGetter(
                () => state.wallet.settings.enabledNetworks,
            ),
            suiteRouterHistory,
            lockDevice: (isLocked: boolean): void => {
                store.dispatch(lockDevice(isLocked));
            },
        }),
        middleware: [
            prepareSuiteMiddleware(() => ({ services: { suiteSync: mockSuiteSync() } })),
            routerMiddleware(() => ({})),
        ],
        reducer: (currentState = state, action) => ({
            ...currentState,
            suite: suiteReducer(currentState.suite, action),
            suiteSettings: suiteSettingsReducer(currentState.suiteSettings, action),
            router: routerReducer(currentState.router, action),
            locks: locksReducer(currentState.locks, action),
        }),
        preloadedState: state,
    });

    return {
        store: services.store,
        suiteRouterHistory,
    };
};

describe('Suite init thunk', () => {
    fixtures.forEach(({ description, options, actions }) => {
        it(description, async () => {
            const { store, suiteRouterHistory } = initStore(getInitialState());

            if (options?.initialPath) {
                suiteRouterHistory.navigate({ pathname: options.initialPath as PathString });
            }

            if (options?.trezorConnectError) {
                jest.spyOn(TrezorConnect, 'init').mockImplementation(() => {
                    throw new Error(options.trezorConnectError);
                });

                try {
                    await store.dispatch(initThunk());
                } catch (err) {
                    expect(err.message).toEqual(options.trezorConnectError);
                }
            } else {
                await expect(store.dispatch(initThunk())).resolves.not.toThrow();
            }

            expect(store.getActions().map(({ type }) => type)).toEqual(actions);

            if (options?.expectedApp) {
                expect(store.getState().router.app).toEqual(options.expectedApp);
            }
        });
    });
});

describe('Suite init thunk with a custom backend', () => {
    type Backends = InitThunkState['wallet']['blockchain']['btc']['backends'];

    const btc = asNetworkSymbol('btc');
    const ltc = asNetworkSymbol('ltc');
    const customBackend: Backends = {
        selected: 'electrum',
        urls: { electrum: ['unreachable.example:50001:t'] },
    };

    const getStateWithBtcAccount = ({
        backends,
        isConnected = false,
        error,
    }: {
        backends: Backends;
        isConnected?: boolean;
        // what the BLOCKCHAIN.ERROR event of a failed connection leaves in the state
        error?: string;
    }): InitThunkState => {
        const state = getInitialState();

        return {
            ...state,
            wallet: {
                ...state.wallet,
                accounts: [mockWalletAccount({ symbol: btc })],
                settings: { ...state.wallet.settings, enabledNetworks: [btc] },
                blockchain: {
                    ...state.wallet.blockchain,
                    btc: {
                        ...state.wallet.blockchain.btc,
                        backends,
                        connected: isConnected,
                        error,
                    },
                },
            },
        };
    };

    const withConnectedLtcAccount = (state: InitThunkState): InitThunkState => ({
        ...state,
        wallet: {
            ...state.wallet,
            accounts: [...state.wallet.accounts, mockWalletAccount({ symbol: ltc })],
            settings: {
                ...state.wallet.settings,
                enabledNetworks: [...state.wallet.settings.enabledNetworks, ltc],
            },
            blockchain: {
                ...state.wallet.blockchain,
                ltc: { ...state.wallet.blockchain.ltc, connected: true },
            },
        },
    });

    const dispatchInit = async (
        state: InitThunkState,
        reconnectResult: ReturnType<typeof TrezorConnect.blockchainUnsubscribeFiatRates>,
        elapsedMs = BACKENDS_INIT_TIMEOUT_MS,
    ) => {
        jest.spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates').mockReturnValue(
            reconnectResult,
        );

        const { store, suiteRouterHistory } = initStore(state);
        suiteRouterHistory.navigate({ pathname: '/accounts' });

        const init = store.dispatch(initThunk());
        await jest.advanceTimersByTimeAsync(elapsedMs);
        await init;

        return store;
    };

    const hangingReconnect = () => new Promise<never>(() => {});
    const failedReconnect = () =>
        Promise.resolve({
            success: false,
            error: { message: 'connect failed', code: 'Backend_Error' },
        } as const);
    const successfulReconnect = () =>
        Promise.resolve({ success: true, payload: { subscribed: false } } as const);

    const getOpenedModalPayloads = (store: Awaited<ReturnType<typeof dispatchInit>>) =>
        store
            .getActions()
            .filter(openModal.match)
            .map(({ payload }) => payload);

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.useFakeTimers({ legacyFakeTimers: false });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('stops waiting for a custom backend that is still connecting, without opening settings', async () => {
        const store = await dispatchInit(
            getStateWithBtcAccount({ backends: customBackend }),
            hangingReconnect(),
        );

        expect(store.getActions().map(({ type }) => type)).toContain(onSuiteReady.type);
        expect(selectRouteName(store.getState())).toBe('wallet-index');
        expect(getOpenedModalPayloads(store)).toEqual([]);
    });

    it('does not fetch rates before the custom backends are set in Connect', async () => {
        jest.spyOn(TrezorConnect, 'blockchainSetCustomBackend').mockReturnValue(hangingReconnect());

        const store = await dispatchInit(
            getStateWithBtcAccount({ backends: customBackend }),
            successfulReconnect(),
        );

        const actionTypes = store.getActions().map(({ type }) => type);
        expect(actionTypes).toContain(onSuiteReady.type);
        expect(actionTypes).not.toContain(periodicCheckTokenDefinitionsThunk.pending.type);
    });

    it('opens the settings of a custom backend that failed to connect', async () => {
        const store = await dispatchInit(
            getStateWithBtcAccount({ backends: customBackend, error: 'connect failed' }),
            failedReconnect(),
        );

        expect(selectRouteName(store.getState())).toBe('settings-coins');
        expect(getOpenedModalPayloads(store)).toEqual([
            { type: 'advanced-coin-settings', symbol: btc },
        ]);
    });

    it('stays on the requested route when the custom backend is connected', async () => {
        const store = await dispatchInit(
            getStateWithBtcAccount({ backends: customBackend, isConnected: true }),
            successfulReconnect(),
        );

        expect(selectRouteName(store.getState())).toBe('wallet-index');
        expect(getOpenedModalPayloads(store)).toEqual([]);
    });

    it('does not open settings while offline', async () => {
        const state = getStateWithBtcAccount({ backends: customBackend, error: 'connect failed' });
        const store = await dispatchInit(
            { ...state, suite: { ...state.suite, online: false } },
            failedReconnect(),
        );

        expect(selectRouteName(store.getState())).toBe('wallet-index');
        expect(getOpenedModalPayloads(store)).toEqual([]);
    });

    it('leaves loading once another network connects, without opening settings', async () => {
        const store = await dispatchInit(
            withConnectedLtcAccount(getStateWithBtcAccount({ backends: customBackend })),
            hangingReconnect(),
            BACKENDS_POLL_INTERVAL_MS,
        );

        expect(store.getActions().map(({ type }) => type)).toContain(onSuiteReady.type);
        expect(selectRouteName(store.getState())).toBe('wallet-index');
        expect(getOpenedModalPayloads(store)).toEqual([]);
    });

    it('stays on the requested route when only default backends are used', async () => {
        const store = await dispatchInit(
            getStateWithBtcAccount({ backends: {} }),
            hangingReconnect(),
        );

        expect(store.getActions().map(({ type }) => type)).toContain(onSuiteReady.type);
        expect(selectRouteName(store.getState())).toBe('wallet-index');
        expect(getOpenedModalPayloads(store)).toEqual([]);
    });
});
