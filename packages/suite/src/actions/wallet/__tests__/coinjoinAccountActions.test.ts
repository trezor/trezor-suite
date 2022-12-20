import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore, testMocks } from '@suite-common/test-utils';

import { accountsReducer } from '@wallet-reducers';
import { coinjoinReducer } from '@wallet-reducers/coinjoinReducer';
import * as coinjoinAccountActions from '../coinjoinAccountActions';
import * as fixtures from '../__fixtures__/coinjoinAccountActions';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('@trezor/connect').default;

jest.mock('@suite/services/coinjoin/coinjoinClient', () => {
    let client: any; // @trezor/coinjoin client
    return {
        // for test purposes enable only btc network
        CoinjoinClientService: {
            getInstance: (symbol: string) => (symbol === 'btc' ? client : null),
            createInstance: (symbol: string) => {
                if (symbol === 'btc') {
                    client = {
                        settings: { coordinatorName: '' },
                        on: jest.fn(),
                        off: jest.fn(),
                        enable: jest.fn(() =>
                            Promise.resolve({
                                rounds: [{ id: '00', phase: 0 }],
                                feeRatesMedians: [],
                                coordinatorFeeRate: 0.003,
                            }),
                        ),
                        registerAccount: jest.fn(),
                        unregisterAccount: jest.fn(),
                    };
                    return client;
                }

                return {
                    enable: jest.fn(() => Promise.reject(new Error('Client not supported'))),
                };
            },
            removeInstance: jest.fn(),
        },
    };
});

jest.mock('@suite/services/coinjoin/coinjoinBackend', () =>
    // for test purposes enable only btc network
    ({
        CoinjoinBackendService: {
            getInstance: () => ({
                on: jest.fn(),
                off: jest.fn(),
                scanAccount: jest.fn(() => Promise.reject(new Error('TODO'))),
            }),
            removeInstance: jest.fn(),
        },
    }),
);

const DEVICE = testMocks.getSuiteDevice({ state: 'device-state', connected: true });

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            device: DEVICE,
            settings: {
                debug: {},
            },
        },
        {},
    ),
    devices: createReducer([DEVICE], {}),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & { devices?: State['devices'] };

const initStore = ({ accounts, coinjoin, devices }: Wallet = {}) => {
    const preloadedState: State = JSON.parse(
        JSON.stringify(rootReducer(undefined, { type: 'init' })),
    );
    if (devices) {
        preloadedState.devices = devices;
    }
    if (accounts) {
        preloadedState.wallet.accounts = accounts;
    }
    if (coinjoin) {
        preloadedState.wallet.coinjoin = {
            ...preloadedState.wallet.coinjoin,
            ...coinjoin,
        };
    }
    // State != suite AppState, therefore <any>
    return configureMockStore<any>({ reducer: rootReducer, preloadedState });
};

describe('coinjoinAccountActions', () => {
    fixtures.createCoinjoinAccount.forEach(f => {
        it(`createCoinjoinAccount: ${f.description}`, async () => {
            const store = initStore();
            TrezorConnect.setTestFixtures(f.connect);

            await store.dispatch(coinjoinAccountActions.createCoinjoinAccount(f.params as any, 80)); // params are incomplete

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.startCoinjoinSession.forEach(f => {
        it(`startCoinjoinSession: ${f.description}`, async () => {
            const store = initStore();
            TrezorConnect.setTestFixtures(f.connect);
            // @ts-expect-error params are incomplete
            await store.dispatch(coinjoinAccountActions.startCoinjoinSession(f.params, {}));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.stopCoinjoinSession.forEach(f => {
        it(`stopCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            await store.dispatch(coinjoinAccountActions.stopCoinjoinSession(f.param));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });
});
