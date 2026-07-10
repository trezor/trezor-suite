import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { selectedAccountReducer } from '@suite/account';
import { locksReducer } from '@suite/locks';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    initPreloadedState,
    testMocks,
} from '@suite-common/test-utils';
import { prepareAccountsReducer } from '@suite-common/wallet-core';

import * as fixtures from '../__fixtures__/coinjoinAccountActions';
import * as coinjoinAccountActions from '../coinjoinAccountActions';
import * as coinjoinClientActions from '../coinjoinClientActions';
import { coinjoinReducer } from '../coinjoinReducer';
import { CoinjoinService } from '../coinjoinService';

jest.mock('../coinjoinService', () => {
    const mock = jest.requireActual('../__fixtures__/mockCoinjoinService');

    return mock.mockCoinjoinService();
});

const DEVICE = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_id:0' },
    connected: true,
});

const rootReducer = combineReducers({
    suite: createReducer(
        {
            settings: {
                debug: {},
            },
        },
        () => ({}),
    ),
    locks: locksReducer,
    messageSystem: prepareMessageSystemReducer(extraDependenciesCommonMock),
    device: createReducer({ devices: [DEVICE], selectedDevice: DEVICE }, () => ({})),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: prepareAccountsReducer(extraDependenciesCommonMock),
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
            partialState: {
                ...(devices !== undefined ? { device: { devices } } : {}),
                wallet: { accounts, coinjoin },
            },
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

            await store.dispatch(
                coinjoinAccountActions.createCoinjoinAccount(
                    f.params.network as any,
                    f.params.account as any,
                ),
            ); // params are incomplete

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
                await CoinjoinService.createInstance({ symbol: f.client as any });
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
                await CoinjoinService.createInstance({ symbol: f.client as any });
            }

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinSession(f.param));

            const actions = store.getActions();

            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });
});
