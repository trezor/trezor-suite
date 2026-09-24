import { createMemoryHistory } from 'history';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { debugInitialState } from '@suite/debug';
import { prepareFlagsReducer } from '@suite/flags';
import { lockDevice, lockRouter, locksInitialState, locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { modalReducer } from '@suite/modal';
import type { PathString } from '@suite/router';
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
import { prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import {
    mockConnectInitSettings,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { asGetter, mock } from '@suite-common/dependency-injection';
import { prepareDeviceReducer } from '@suite-common/device';
import {
    fetchConfigThunk,
    initMessageSystemThunk,
    messageSystemActions,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { validJws } from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { mockGetAllowPrerelease, mockGetBinFilesBaseUrl } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import {
    initTokenDefinitionsThunk,
    periodicCheckTokenDefinitionsThunk,
} from '@suite-common/token-definitions';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import {
    defaultTrezorUIEventHandlerThunk,
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
import { walletConnectInitThunk } from '@suite-common/walletconnect';
import TrezorConnect from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';
import { initialBreakpointFlags } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { type InitThunkDesktopApiDep, initThunk } from 'src/actions/suite/initAction';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import windowReducer from 'src/reducers/suite/windowReducer';
import { walletReducers } from 'src/reducers/wallet';
import { createSuiteConnectInit } from 'src/support/createSuiteConnectInit';
import type { AppState } from 'src/types/suite';

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
const analyticsReducer = prepareAnalyticsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
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

const getInitialState = (initialRun?: boolean) => {
    const initialFlagsState = flagsReducer(undefined, EMPTY_ACTION);

    return {
        networks: mockNetworksState(mockGetSupportedNetworks()),
        suite: suiteReducer(undefined, EMPTY_ACTION),
        suiteSettings: suiteSettingsInitialState,
        debug: debugInitialState,
        flags: {
            ...(initialRun !== undefined
                ? { ...initialFlagsState, initialRun }
                : { ...initialFlagsState }),
        },
        locks: locksInitialState,
        router: routerReducer(undefined, EMPTY_ACTION),
        analytics: analyticsReducer(undefined, EMPTY_ACTION),
        modal: modalReducer(undefined, EMPTY_ACTION),
        wallet: walletReducers(undefined, EMPTY_ACTION),
        messageSystem: messageSystemReducer(undefined, EMPTY_ACTION),
        device: deviceReducer(undefined, EMPTY_ACTION),
        metadata: metadataReducer(undefined, EMPTY_ACTION),
        firmware: { firmwareChannel: 'production' },
        window: windowReducer({ ...initialBreakpointFlags, isVisible: true }, EMPTY_ACTION),
    };
};

type Fixture = {
    description: string;
    actions: string[];
    options: {
        initialPath?: string;
        expectedApp?: AppState['router']['app'];
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
            onLocationChangeThunk.fulfilled.type,
            gotoThunk.fulfilled.type,
            initialRedirectionThunk.fulfilled.type,
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
            initialRedirectionThunk.fulfilled.type,
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
            initialRedirectionThunk.fulfilled.type,
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
            onLocationChangeThunk.fulfilled.type,
            gotoThunk.fulfilled.type,
            initialRedirectionThunk.fulfilled.type,
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

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });
    const store = createTestStore({
        extra: {
            services: {
                ...createDesktopApiDep(),
                analytics: mockDesktopAnalytics(),
                connectInit: (): Promise<void> =>
                    createSuiteConnectInit({
                        dispatch: store.dispatch,
                        getState: store.getState,
                        analytics: mockDesktopAnalytics(),
                        lockDevice,
                        connectInitSettings: mockConnectInitSettings(),
                        createLogger: noopCreateLogger,
                        createTransports: mockCreateTransports(),
                        getAllowPrerelease: mockGetAllowPrerelease(),
                        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
                        getDebugSettings: mockGetDebugSettings(),
                        getThpSettings: mockGetThpSettings(),
                        trezorUiEventHandler: action =>
                            store.dispatch(defaultTrezorUIEventHandlerThunk(action)),
                    })(),
                getIsWindowVisible: asGetter(() => true),
                getTokenDefinitionsEnabledNetworks: asGetter(
                    () => state.wallet.settings.enabledNetworks,
                ),
                suiteRouterHistory,
            },
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
        store,
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
