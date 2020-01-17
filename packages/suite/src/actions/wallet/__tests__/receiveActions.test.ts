/* eslint-disable global-require */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import receiveReducer from '@wallet-reducers/receiveReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import fixtures from '../__fixtures__/receiveActions';

const { getSuiteDevice } = global.JestMocks;

jest.mock('trezor-connect', () => {
    let fixture: any;

    const getAddress = (_params: any) => {
        if (fixture && fixture.getAddress) {
            return fixture.getAddress;
        }
        return {
            success: true,
            payload: {
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
        };
    };
    return {
        __esModule: true, // this property makes it work
        default: {
            on: (_event: any, _handler: any) => _handler(),
            off: () => null,
            getAddress,
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {},
        UI: {},
        TRANSPORT: {},
    };
});

type ReceiveState = ReturnType<typeof receiveReducer>;
type SuiteState = ReturnType<typeof suiteReducer>;

interface InitialState {
    suite: Partial<SuiteState>;
    wallet?: {
        receive?: Partial<ReceiveState>;
    };
}

export const getInitialState = (state: InitialState | undefined) => {
    return {
        suite: {
            device: getSuiteDevice({ available: true, connected: true }),
            // @ts-ignore
            ...suiteReducer(state && state.suite, { type: 'foo' } as any),
        },
        wallet: {
            receive: receiveReducer(undefined, { type: 'foo' } as any),
            selectedAccount: {
                account: {
                    networkType: 'bitcoin',
                },
            },
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { receive } = store.getState().wallet;
        store.getState().wallet.receive = receiveReducer(receive, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('ReceiveActions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            require('trezor-connect').setTestFixtures(f.mocks);
            const state = getInitialState(f.initialState);
            const store = initStore(state);
            await store.dispatch(f.action());
            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });
});
