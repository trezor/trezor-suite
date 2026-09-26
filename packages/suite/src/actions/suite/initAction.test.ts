import { createMemoryHistory } from 'history';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { prepareFlagsReducer } from '@suite/flags';
import { lockRouter, locksInitialState, locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { modalReducer } from '@suite/modal';
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
} from '@suite/router';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '@suite/settings';
import { onSuiteInit, onSuiteReady } from '@suite/suite-lifecycle';
import {
    type ConnectInitState,
    createConnectInitCompositionRoot,
} from '@suite-common/connect-init';
import {
    mockConnectInitDeviceEventHooks,
    mockConnectInitSettings,
    mockConnectInitUiEventHooks,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { connectPopupInitialState } from '@suite-common/connect-popup';
import { asGetter, mock } from '@suite-common/dependency-injection';
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
import { type WithServices } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import {
    type ConnectInitDep,
    type ConnectInitUiEventHooksDep,
    type LockDevice,
} from '@suite-common/suite-types';
import { mockGetAllowPrerelease, mockGetBinFilesBaseUrl } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type InitTokenDefinitionsThunkDeps,
    initTokenDefinitionsThunk,
    periodicCheckTokenDefinitionsThunk,
    tokenDefinitionsInitialState,
} from '@suite-common/token-definitions';
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
import {
    type WalletConnectInitThunkDeps,
    walletConnectInitThunk,
    walletConnectInitialState,
} from '@suite-common/walletconnect';
import TrezorConnect from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';

import { SUITE } from 'src/actions/suite/constants';
import {
    type InitThunkDesktopApiDep,
    type InitThunkState,
    initThunk,
} from 'src/actions/suite/initAction';
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

// connectInit is composed from the same store, so the state also covers what it reads.
type InitActionTestState = InitThunkState & ConnectInitState;

const getInitialState = (initialRun?: boolean): InitActionTestState => {
    const initialFlagsState = flagsReducer(undefined, EMPTY_ACTION);

    return {
        networks: mockNetworksState(mockGetSupportedNetworks()),
        suite: suiteReducer(undefined, EMPTY_ACTION),
        suiteSettings: suiteSettingsInitialState,
        flags: {
            ...(initialRun !== undefined
                ? { ...initialFlagsState, initialRun }
                : { ...initialFlagsState }),
        },
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
    };
};

type Fixture = {
    description: string;
    actions: string[];
    options: {
        initialPath?: string;
        expectedApp?: InitThunkState['router']['app'];
        initialRun?: boolean;
        trezorConnectError?: string;
    };
};

const fixtures: Fixture[] = [
    {
        description: 'Successful initial run',
        options: {
            initialPath: '/accounts',
            expectedApp: 'start',
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
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            onLocationChangeThunk.fulfilled.type,
            gotoThunk.fulfilled.type,
            initialRedirectionThunk.fulfilled.type,
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
            periodicCheckStakeDataThunk.pending.type,
            initStakeDataThunk.pending.type,
            stakeDataActions.fetchStakeDataRequest.type,
            walletConnectInitThunk.pending.type,
            onSuiteReady.type,
            stakeDataActions.fetchStakeDataFailure.type,
        ],
    },
    {
        description: 'Successful non-initial run',
        options: {
            initialPath: '/accounts',
            expectedApp: 'wallet',
            initialRun: false,
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
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            initialRedirectionThunk.fulfilled.type,
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
            stakeDataActions.fetchStakeDataFailure.type,
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
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            initialRedirectionThunk.fulfilled.type,
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
            stakeDataActions.fetchStakeDataFailure.type,
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

type InitActionTestDeps = GotoThunkDeps &
    InitBlockchainThunkDeps &
    InitTokenDefinitionsThunkDeps &
    PeriodicFetchFiatRatesThunkDeps &
    WalletConnectInitThunkDeps &
    WithServices<ConnectInitDep & ConnectInitUiEventHooksDep & InitThunkDesktopApiDep>;

const initStore = (state: InitActionTestState) => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });
    const { services } = createTestCompositionRoot<InitActionTestDeps, InitActionTestState>({
        services: store => {
            const analytics = mockDesktopAnalytics();
            const lockDevice = mock<LockDevice>();
            const { connectInit } = createConnectInitCompositionRoot({
                dispatch: store.dispatch,
                getState: store.getState,
                lockDevice,
                analytics,
                connectInitDeviceEventHooks: mockConnectInitDeviceEventHooks(),
                connectInitSettings: mockConnectInitSettings(),
                createLogger: noopCreateLogger,
                createTransports: mockCreateTransports(),
                getAllowPrerelease: mockGetAllowPrerelease(),
                getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
                getDebugSettings: mockGetDebugSettings(),
                getThpSettings: mockGetThpSettings(),
            });

            return {
                ...createDesktopApiDep(),
                analytics,
                connectInit,
                connectInitUiEventHooks: mockConnectInitUiEventHooks(),
                getIsWindowVisible: asGetter(() => true),
                getTokenDefinitionsEnabledNetworks: asGetter(
                    () => state.wallet.settings.enabledNetworks,
                ),
                lockDevice,
                suiteRouterHistory,
            };
        },
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
            const { store, suiteRouterHistory } = initStore(getInitialState(options.initialRun));

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
