import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, initPreloadedState, testMocks } from '@suite-common/test-utils';

import { accountsReducer } from 'src/reducers/wallet';
import { coinjoinReducer } from 'src/reducers/wallet/coinjoinReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import { CoinjoinService } from 'src/services/coinjoin/coinjoinService';

import * as coinjoinAccountActions from '../coinjoinAccountActions';
import * as coinjoinClientActions from '../coinjoinClientActions';
import * as fixtures from '../__fixtures__/coinjoinAccountActions';

jest.mock('src/services/coinjoin/coinjoinService', () => {
    const mock = jest.requireActual('../__fixtures__/mockCoinjoinService');
    return mock.mockCoinjoinService();
});

const DEVICE = testMocks.getSuiteDevice({ state: 'device-state', connected: true });

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            settings: {
                debug: {},
            },
        },
        () => ({}),
    ),
    device: createReducer({ devices: [DEVICE], selectedDevice: DEVICE }, () => ({})),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
        selectedAccount: selectedAccountReducer,
        blockchain: () => ({ btc: { blockHeight: 150 } }),
        transactions: () => ({ transactions: {} }),
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & { devices?: State['device']['devices'] };

const initStore = ({ accounts, coinjoin, devices }: Wallet = {}) =>
    // State != suite AppState, therefore <any>
    configureMockStore<any>({
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: { device: { devices }, wallet: { accounts, coinjoin } },
        }),
    });

describe('coinjoinAccountActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        CoinjoinService.getInstances().forEach(({ client }) => {
            CoinjoinService.removeInstance(client.settings.network);
        });
    });

    fixtures.createCoinjoinAccount.forEach(f => {
        it(`createCoinjoinAccount: ${f.description}`, async () => {
            const store = initStore();
            testMocks.setTrezorConnectFixtures(f.connect);
            jest.spyOn(console, 'log').mockImplementation(() => {});

            await store.dispatch(coinjoinAccountActions.createCoinjoinAccount(f.params as any)); // params are incomplete

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.startCoinjoinSession.forEach(f => {
        it(`startCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            testMocks.setTrezorConnectFixtures(f.connect);
            // @ts-expect-error params are incomplete
            await store.dispatch(coinjoinAccountActions.startCoinjoinSession(f.params, {}));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.stopCoinjoinSession.forEach(f => {
        it(`stopCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            if (f.client) {
                await CoinjoinService.createInstance({ network: f.client as any });
            }

            await store.dispatch(coinjoinClientActions.stopCoinjoinSession(f.param));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.restoreCoinjoinAccounts.forEach(f => {
        it(`restoreCoinjoinAccounts: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinAccounts());

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.restoreCoinjoinSession.forEach(f => {
        it(`restoreCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            if (f.client) {
                await CoinjoinService.createInstance({ network: f.client as any });
            }

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinSession(f.param));

            const actions = store.getActions();

            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });
});
