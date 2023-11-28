import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { prepareMessageSystemReducer } from '@suite-common/message-system';

import { extraDependencies } from 'src/support/extraDependencies';
import routerReducer from 'src/reducers/suite/routerReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { CoinjoinService } from 'src/services/coinjoin/coinjoinService';
import { coinjoinMiddleware } from 'src/middlewares/wallet/coinjoinMiddleware';
import { fixtures } from 'src/middlewares/wallet/__fixtures__/coinjoinMiddleware';
import { accountsReducer } from 'src/reducers/wallet';
import { coinjoinReducer } from 'src/reducers/wallet/coinjoinReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';

jest.mock('src/services/coinjoin/coinjoinService', () => {
    const mock = jest.requireActual('../../../actions/wallet/__fixtures__/mockCoinjoinService');
    return mock.mockCoinjoinService();
});

const messageSystem = prepareMessageSystemReducer(extraDependencies);

const rootReducer = combineReducers({
    device: createReducer({}, () => ({})),
    messageSystem,
    router: routerReducer,
    suite: suiteReducer,
    wallet: combineReducers({
        accounts: accountsReducer,
        coinjoin: coinjoinReducer,
        selectedAccount: selectedAccountReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;

const initStore = ({ device, router, suite, wallet }: Partial<State> = {}) => {
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
                await CoinjoinService.createInstance({ network: f.client });
            }

            store.dispatch(f.action);
            expect(await store.getActions()).toEqual([f.action, ...f.expectedActions]);
        });
    });
});
