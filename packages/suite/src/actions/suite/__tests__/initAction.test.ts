/* eslint-disable @typescript-eslint/no-var-requires */
import {
    prepareMessageSystemReducer,
    messageSystemActions,
    initMessageSystemThunk,
    fetchConfigThunk,
} from '@suite-common/message-system';
import {
    validJws,
    DEV_JWS_PUBLIC_KEY,
} from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import { connectInitThunk } from '@suite-common/connect-init';
import {
    prepareDeviceReducer,
    initDevices,
    blockchainActions,
    initBlockchainThunk,
    preloadFeeInfoThunk,
} from '@suite-common/wallet-core';
import { analyticsActions, prepareAnalyticsReducer } from '@suite-common/analytics';

import { configureStore } from 'src/support/tests/configureStore';
import { SUITE, ROUTER } from 'src/actions/suite/constants';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import modalReducer from 'src/reducers/suite/modalReducer';
import routerReducer from 'src/reducers/suite/routerReducer';
import metadataReducer from 'src/reducers/suite/metadataReducer';
import walletReducers from 'src/reducers/wallet';
import { init } from 'src/actions/suite/initAction';
import suiteMiddleware from 'src/middlewares/suite/suiteMiddleware';
import type { AppState } from 'src/types/suite';
import { extraDependencies } from 'src/support/extraDependencies';

import { appChanged } from '../suiteActions';

const deviceReducer = prepareDeviceReducer(extraDependencies);
const analyticsReducer = prepareAnalyticsReducer(extraDependencies);
const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);

process.env.JWS_PUBLIC_KEY = DEV_JWS_PUBLIC_KEY;
jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
const TrezorConnect = require('@trezor/connect').default;

global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        text: () => Promise.resolve(validJws),
    }),
);

const EMPTY_ACTION = { type: 'foo' } as any;

const getInitialState = (initialRun?: boolean) => ({
    suite: {
        ...suiteReducer(undefined, EMPTY_ACTION),
        ...(initialRun !== undefined ? ({ flags: { initialRun } } as any) : {}),
    },
    router: routerReducer(undefined, EMPTY_ACTION),
    analytics: analyticsReducer(undefined, EMPTY_ACTION),
    modal: modalReducer(undefined, EMPTY_ACTION),
    wallet: walletReducers(undefined, EMPTY_ACTION),
    messageSystem: messageSystemReducer(undefined, EMPTY_ACTION),
    device: deviceReducer(undefined, EMPTY_ACTION),
    metadata: metadataReducer(undefined, EMPTY_ACTION),
});

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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            appChanged.type,
            ROUTER.LOCATION_CHANGE,
            SUITE.LOCK_ROUTER,
            connectInitThunk.pending.type,
            initDevices.fulfilled.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            blockchainActions.updateFee.type,
            preloadFeeInfoThunk.fulfilled.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            SUITE.READY,
            initMessageSystemThunk.fulfilled.type,
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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            connectInitThunk.pending.type,
            initDevices.fulfilled.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            blockchainActions.updateFee.type,
            preloadFeeInfoThunk.fulfilled.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            appChanged.type,
            ROUTER.LOCATION_CHANGE,
            SUITE.READY,
            initMessageSystemThunk.fulfilled.type,
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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            connectInitThunk.pending.type,
            initDevices.fulfilled.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            blockchainActions.updateFee.type,
            preloadFeeInfoThunk.fulfilled.type,
            messageSystemActions.fetchSuccessUpdate.type,
            fetchConfigThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            ROUTER.LOCATION_CHANGE,
            SUITE.READY,
            initMessageSystemThunk.fulfilled.type,
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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            appChanged.type,
            ROUTER.LOCATION_CHANGE,
            SUITE.LOCK_ROUTER,
            connectInitThunk.pending.type,
            initDevices.fulfilled.type,
            connectInitThunk.rejected.type,
            SUITE.ERROR,
        ],
    },
];

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([suiteMiddleware]);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().slice(-1)[0];
        const { suite, router } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);
    });
    return store;
};

describe('Suite init action', () => {
    fixtures.forEach(({ description, options, actions }) => {
        it(description, async () => {
            const store = initStore(getInitialState(options.initialRun));

            if (options?.initialPath) {
                // eslint-disable-next-line global-require
                require('src/support/history').default.location.pathname = options.initialPath;
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
