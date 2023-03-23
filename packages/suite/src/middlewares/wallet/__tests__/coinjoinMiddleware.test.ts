import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore } from '@suite-common/test-utils';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { extraDependencies } from '@suite/support/extraDependencies';
import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import { CoinjoinService } from '@suite/services/coinjoin/coinjoinService';
import { coinjoinMiddleware } from '@wallet-middlewares/coinjoinMiddleware';
import { fixtures } from '@wallet-middlewares/__fixtures__/coinjoinMiddleware';
import { accountsReducer } from '@wallet-reducers';
import { coinjoinReducer } from '@wallet-reducers/coinjoinReducer';
import selectedAccountReducer from '@wallet-reducers/selectedAccountReducer';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line
const TrezorConnect = require('@trezor/connect').default;

jest.mock('@suite/services/coinjoin/coinjoinService', () => {
    const mock = jest.requireActual('../../../actions/wallet/__fixtures__/mockCoinjoinService');
    return mock.mockCoinjoinService();
});

const messageSystem = prepareMessageSystemReducer(extraDependencies);

const rootReducer = combineReducers({
    devices: createReducer({}, () => ({})),
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

const initStore = ({ devices, router, suite, wallet }: Partial<State> = {}) => {
    const preloadedState: State = rootReducer(undefined, { type: 'init' });

    if (devices) {
        preloadedState.devices = devices;
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
                TrezorConnect.setTestFixtures(f.connect);
            }

            if (f.client) {
                await CoinjoinService.createInstance(f.client);
            }

            store.dispatch(f.action);
            expect(await store.getActions()).toEqual([f.action, ...f.expectedActions]);
        });
    });
});
