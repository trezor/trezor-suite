import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
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
                        enable: jest.fn(() => Promise.resolve({ rounds: [{ id: '00' }] })),
                        registerAccount: jest.fn(),
                        unregisterAccount: jest.fn(),
                    };
                    return client;
                }

                return {
                    enable: jest.fn(() => Promise.reject(new Error('Client not supported'))),
                };
            },
        },
    };
});

const DEVICE = global.JestMocks.getSuiteDevice({ state: 'device-state', connected: true });
export const getInitialState = () => ({
    suite: {
        locks: [],
        device: DEVICE,
    },
    devices: [DEVICE],
    wallet: {
        coinjoin: coinjoinReducer(undefined, { type: 'foo' } as any),
    },
    modal: {},
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinjoin } = store.getState().wallet;
        store.getState().wallet = {
            coinjoin: coinjoinReducer(coinjoin, action),
        };
        store.getActions().push(action);
    });
    return store;
};

describe('coinjoinAccountActions', () => {
    fixtures.createCoinjoinAccount.forEach(f => {
        it(`createCoinjoinAccount: ${f.description}`, async () => {
            const initialState = getInitialState();
            const store = initStore(initialState);
            TrezorConnect.setTestFixtures(f.connect);

            await store.dispatch(coinjoinAccountActions.createCoinjoinAccount(f.params as any)); // params are incomplete

            const actions = store.getActions();
            expect(actions.length).toBe(f.result.actions.length);
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.startCoinjoinSession.forEach(f => {
        it(`startCoinjoinSession: ${f.description}`, async () => {
            const initialState = getInitialState();
            const store = initStore(initialState);
            TrezorConnect.setTestFixtures(f.connect);
            // @ts-expect-error params are incomplete
            await store.dispatch(coinjoinAccountActions.startCoinjoinSession(f.params, {}));

            const actions = store.getActions();
            expect(actions.length).toBe(f.result.actions.length);
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.stopCoinjoinSession.forEach(f => {
        it(`stopCoinjoinSession: ${f.description}`, async () => {
            const initialState = getInitialState();
            const store = initStore(initialState);

            await store.dispatch(coinjoinAccountActions.stopCoinjoinSession(f.params as any));

            const actions = store.getActions();
            expect(actions.length).toBe(f.result.actions.length);
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });
});
