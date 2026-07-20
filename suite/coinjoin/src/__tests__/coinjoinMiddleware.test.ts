import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { selectedAccountReducer } from '@suite/account';
import { locksReducer } from '@suite/locks';
import { routerReducer } from '@suite/router';
import { torReducer } from '@suite/tor';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    testMocks,
} from '@suite-common/test-utils';
import { prepareAccountsReducer } from '@suite-common/wallet-core';
import '@suite-common/test-utils/globalOverrides';

import { fixtures } from '../__fixtures__/coinjoinMiddleware';
import { coinjoinMiddleware } from '../coinjoinMiddleware';
import { coinjoinReducer } from '../coinjoinReducer';
import { CoinjoinService } from '../coinjoinService';

jest.mock('../coinjoinService', () => {
    const mock = jest.requireActual('../__fixtures__/mockCoinjoinService');

    return mock.mockCoinjoinService();
});

const messageSystem = prepareMessageSystemReducer(extraDependenciesCommonMock);

const rootReducer = combineReducers({
    device: createReducer({}, () => ({})),
    locks: locksReducer,
    messageSystem,
    router: routerReducer,
    suite: createReducer({ online: true }, () => ({})),
    tor: torReducer,
    discreetMode: createReducer({ isActive: false }, () => {}),
    wallet: combineReducers({
        accounts: prepareAccountsReducer(extraDependenciesCommonMock),
        coinjoin: coinjoinReducer,
        selectedAccount: selectedAccountReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;

const initStore = ({ device, router, suite, tor, wallet }: Partial<State> = {}) => {
    const preloadedState: State = rootReducer(undefined, { type: 'init' });

    if (device) {
        preloadedState.device = device;
    }

    if (router) {
        preloadedState.router = {
            ...preloadedState.router,
            ...router,
        };
    }

    if (suite) {
        preloadedState.suite = {
            ...preloadedState.suite,
            ...suite,
        };
    }

    if (tor) {
        preloadedState.tor = {
            ...preloadedState.tor,
            ...tor,
        };
    }

    if (wallet) {
        preloadedState.wallet = {
            ...preloadedState.wallet,
            ...wallet,
        };
    }

    const store = configureMockStore({
        reducer: rootReducer,
        preloadedState,
        middleware: [coinjoinMiddleware],
    });

    return store;
};

describe('coinjoinMiddleware', () => {
    beforeEach(() => {
        CoinjoinService.getInstances().forEach(({ client }) => {
            CoinjoinService.removeInstance(client.settings.network);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.state);

            if (f.connect) {
                testMocks.setTrezorConnectFixtures(f.connect);
            }

            if (f.client) {
                await CoinjoinService.createInstance({ symbol: f.client });
            }

            store.dispatch(f.action);
            expect(await store.getActions()).toEqual([f.action, ...f.expectedActions]);
        });
    });
});
