import { createMemoryHistory } from 'history';

import { prepareFlagsReducer } from '@suite/flags';
import { lockRouter, locksInitialState, locksReducer } from '@suite/locks';
import { metadataReducer } from '@suite/metadata';
import { modalReducer } from '@suite/modal';
import type { PathString } from '@suite/router';
import {
    createSuiteRouterHistory,
    goto,
    initialRedirection,
    onLocationChange,
    routerAppChanged,
    routerInit,
    routerLocationChange,
    routerMiddleware,
    routerReducer,
} from '@suite/router';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '@suite/settings';
import { prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { connectInitThunk } from '@suite-common/connect-init';
import { prepareDeviceReducer } from '@suite-common/device';
import {
    fetchConfigThunk,
    initMessageSystemThunk,
    messageSystemActions,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { validJws } from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    initTokenDefinitionsThunk,
    periodicCheckTokenDefinitionsThunk,
} from '@suite-common/token-definitions';
import {
    feesActions,
    fetchEverstakeData,
    fetchEverstakeStakingInfo,
    fetchFiatRatesThunk,
    initBlockchainThunk,
    initDevices,
    initStakeDataThunk,
    periodicCheckStakeDataThunk,
    periodicFetchFiatRatesThunk,
    preloadFeeInfoThunk,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import { walletConnectInitThunk } from '@suite-common/walletconnect';
import TrezorConnect from '@trezor/connect';
import { initialBreakpointFlags } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { init } from 'src/actions/suite/initAction';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import windowReducer from 'src/reducers/suite/windowReducer';
import walletReducers from 'src/reducers/wallet';
import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore } from 'src/support/tests/configureStore';
import type { AppState } from 'src/types/suite';

const deviceReducer = prepareDeviceReducer(extraDependencies);
const analyticsReducer = prepareAnalyticsReducer(extraDependencies);
const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);
const flagsReducer = prepareFlagsReducer(extraDependencies);
const suiteSettingsReducer = prepareSuiteSettingsReducer(extraDependencies);

global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        text: () => Promise.resolve(validJws),
    }),
);

const EMPTY_ACTION = { type: 'foo' } as any;

const getInitialState = (initialRun?: boolean) => {
    const initialFlagsState = flagsReducer(undefined, EMPTY_ACTION);
    const walletState = walletReducers(undefined, EMPTY_ACTION);

    return {
        suite: suiteReducer(undefined, EMPTY_ACTION),
        suiteSettings: suiteSettingsInitialState,
        flags: {
            ...(initialRun !== undefined
                ? { ...initialFlagsState, initialRun }
                : { ...initialFlagsState }),
        },
        locks: locksInitialState,
        router: routerReducer(undefined, EMPTY_ACTION),
        analytics: analyticsReducer(undefined, EMPTY_ACTION),
        modal: modalReducer(undefined, EMPTY_ACTION),
        wallet: {
            ...walletState,
            settings: { ...walletState.settings, enabledNetworks: ['btc'] },
        },
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
            SUITE.INIT,
            initDevices.pending.type,
            initDevices.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirection.pending.type,
            goto.pending.type,
            onLocationChange.pending.type,
            routerAppChanged.type,
            routerLocationChange.type,
            lockRouter.type,
            connectInitThunk.pending.type,
            onLocationChange.fulfilled.type,
            goto.fulfilled.type,
            initialRedirection.fulfilled.type,
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
            routerInit.pending.type,
            periodicCheckStakeDataThunk.pending.type,
            initStakeDataThunk.pending.type,
            // ETH calls both PoolStats and ValidatorsQueue, SOL/ADA each call StakingInfo
            fetchEverstakeData.pending.type,
            fetchEverstakeData.pending.type,
            fetchEverstakeStakingInfo.pending.type,
            fetchEverstakeStakingInfo.pending.type,
            walletConnectInitThunk.pending.type,
            SUITE.READY,
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
            SUITE.INIT,
            initDevices.pending.type,
            initDevices.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirection.pending.type,
            connectInitThunk.pending.type,
            initialRedirection.fulfilled.type,
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
            routerInit.pending.type,
            onLocationChange.pending.type,
            routerAppChanged.type,
            routerLocationChange.type,
            periodicCheckStakeDataThunk.pending.type,
            initStakeDataThunk.pending.type,
            // ETH calls both PoolStats and ValidatorsQueue, SOL/ADA each call StakingInfo
            fetchEverstakeData.pending.type,
            fetchEverstakeData.pending.type,
            fetchEverstakeStakingInfo.pending.type,
            fetchEverstakeStakingInfo.pending.type,
            walletConnectInitThunk.pending.type,
            SUITE.READY,
        ],
    },
    {
        description: 'Successful non-existent path',
        options: {
            initialPath: '/foo-bar',
            expectedApp: 'unknown',
        },
        actions: [
            SUITE.INIT,
            initDevices.pending.type,
            initDevices.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirection.pending.type,
            connectInitThunk.pending.type,
            initialRedirection.fulfilled.type,
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
            routerInit.pending.type,
            onLocationChange.pending.type,
            routerLocationChange.type,
            periodicCheckStakeDataThunk.pending.type,
            initStakeDataThunk.pending.type,
            // ETH calls both PoolStats and ValidatorsQueue, SOL/ADA each call StakingInfo
            fetchEverstakeData.pending.type,
            fetchEverstakeData.pending.type,
            fetchEverstakeStakingInfo.pending.type,
            fetchEverstakeStakingInfo.pending.type,
            walletConnectInitThunk.pending.type,
            SUITE.READY,
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
            SUITE.INIT,
            initDevices.pending.type,
            initDevices.fulfilled.type,
            suiteSettingsActions.setLanguage.type,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            initialRedirection.pending.type,
            goto.pending.type,
            onLocationChange.pending.type,
            routerAppChanged.type,
            routerLocationChange.type,
            lockRouter.type,
            connectInitThunk.pending.type,
            onLocationChange.fulfilled.type,
            goto.fulfilled.type,
            initialRedirection.fulfilled.type,
            connectInitThunk.rejected.type,
            SUITE.ERROR,
        ],
    },
];

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });
    const mockStore = configureStore<State, any>(
        [
            prepareSuiteMiddleware(() => extraDependenciesCommonMock),
            routerMiddleware(() => extraDependenciesCommonMock),
        ],
        {
            services: {
                suiteRouterHistory,
            },
        },
    );
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().slice(-1)[0];
        const { suite, suiteSettings, router, locks } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().suiteSettings = suiteSettingsReducer(suiteSettings, action);
        store.getState().router = routerReducer(router, action);
        store.getState().locks = locksReducer(locks, action);
    });

    return {
        store,
        suiteRouterHistory,
    };
};

describe('Suite init action', () => {
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
                    await store.dispatch(init());
                } catch (err) {
                    expect(err.message).toEqual(options.trezorConnectError);
                }
            } else {
                await expect(store.dispatch(init())).resolves.not.toThrow();
            }

            expect(store.getActions().map(({ type }) => type)).toEqual(actions);

            if (options?.expectedApp) {
                expect(store.getState().router.app).toEqual(options.expectedApp);
            }
        });
    });
});
