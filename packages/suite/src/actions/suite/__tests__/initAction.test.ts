/* eslint-disable @typescript-eslint/no-var-requires */
import { configureStore } from '@suite/support/tests/configureStore';
import { SUITE, ROUTER } from '@suite-actions/constants';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';
import routerReducer from '@suite-reducers/routerReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import {
    prepareMessageSystemReducer,
    messageSystemActions,
    initMessageSystemThunk,
    fetchConfigThunk,
} from '@suite-common/message-system';
import walletReducers from '@wallet-reducers';
import { init } from '@suite-actions/initAction';
import suiteMiddleware from '@suite-middlewares/suiteMiddleware';
import {
    validJws,
    DEV_JWS_PUBLIC_KEY,
} from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import type { AppState } from '@suite-types';
import { extraDependencies } from '@suite/support/extraDependencies';

import { connectInitThunk } from '@suite-common/connect-init';
import {
    blockchainActions,
    initBlockchainThunk,
    preloadFeeInfoThunk,
} from '@suite-common/wallet-core';
import { analyticsActions, prepareAnalyticsReducer } from '@suite-common/analytics';

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
    devices: deviceReducer(undefined, EMPTY_ACTION),
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
            expectedApp: 'onboarding',
        },
        actions: [
            SUITE.INIT,
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            SUITE.APP_CHANGED,
            ROUTER.LOCATION_CHANGE,
            SUITE.LOCK_ROUTER,
            connectInitThunk.pending.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            blockchainActions.updateFee.type,
            messageSystemActions.fetchSuccessUpdate.type,
            preloadFeeInfoThunk.fulfilled.type,
            fetchConfigThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            connectInitThunk.pending.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            blockchainActions.updateFee.type,
            messageSystemActions.fetchSuccessUpdate.type,
            preloadFeeInfoThunk.fulfilled.type,
            fetchConfigThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            SUITE.APP_CHANGED,
            ROUTER.LOCATION_CHANGE,
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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            connectInitThunk.pending.type,
            connectInitThunk.fulfilled.type,
            initBlockchainThunk.pending.type,
            preloadFeeInfoThunk.pending.type,
            blockchainActions.updateFee.type,
            messageSystemActions.fetchSuccessUpdate.type,
            preloadFeeInfoThunk.fulfilled.type,
            fetchConfigThunk.fulfilled.type,
            initBlockchainThunk.fulfilled.type,
            initMessageSystemThunk.fulfilled.type,
            ROUTER.LOCATION_CHANGE,
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
            analyticsActions.initAnalytics.type,
            SUITE.SET_LANGUAGE,
            initMessageSystemThunk.pending.type,
            fetchConfigThunk.pending.type,
            SUITE.APP_CHANGED,
            ROUTER.LOCATION_CHANGE,
            SUITE.LOCK_ROUTER,
            connectInitThunk.pending.type,
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
                require('@suite/support/history').default.location.pathname = options.initialPath;
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
