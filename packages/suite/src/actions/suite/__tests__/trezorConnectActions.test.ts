/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT } from '@trezor/connect';
import suiteReducer from '@suite-reducers/suiteReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import { SUITE } from '@suite-actions/constants';
import { init } from '../trezorConnectActions';

jest.mock('@trezor/connect', () => {
    let fixture: any;
    const callbacks: { [key: string]: (e: any) => any } = {};
    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            init: () => {
                if (typeof fixture === 'function') throw fixture();
                return true;
            },
            on: (event: string, cb: (e: any) => any) => {
                callbacks[event] = cb;
            },
            getFeatures: () => ({
                success: true,
            }),
        },
        DEVICE_EVENT: 'DEVICE_EVENT',
        UI_EVENT: 'UI_EVENT',
        TRANSPORT_EVENT: 'TRANSPORT_EVENT',
        BLOCKCHAIN_EVENT: 'BLOCKCHAIN_EVENT',
        DEVICE: {},
        TRANSPORT: {},
        BLOCKCHAIN: {},
        // custom method for test purpose
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        emit: (event: string, data: any) => {
            callbacks[event].call(undefined, {
                event,
                ...data,
            });
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
export const getInitialState = (suite?: Partial<SuiteState>, devices?: DevicesState) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    devices: devices || [],
    wallet: {
        settings: {
            enabledNetworks: [],
        },
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, devices } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().devices = deviceReducer(devices, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('TrezorConnect Actions', () => {
    it('Success', () => {
        const state = getInitialState();
        const store = initStore(state);
        expect(() => store.dispatch(init())).not.toThrow();
    });

    it('Error', async () => {
        require('@trezor/connect').setTestFixtures(() => new Error('Iframe error'));
        const state = getInitialState();
        const store = initStore(state);
        await expect(() => store.dispatch(init())).rejects.toThrow('Iframe error');
        require('@trezor/connect').setTestFixtures(undefined);
    });

    it('TypedError', async () => {
        require('@trezor/connect').setTestFixtures(() => ({
            message: 'Iframe error',
            code: 'SomeCode',
        }));
        const state = getInitialState();
        const store = initStore(state);
        await expect(() => store.dispatch(init())).rejects.toThrow('SomeCode: Iframe error');
        require('@trezor/connect').setTestFixtures(undefined);
    });

    it('Error as string', async () => {
        require('@trezor/connect').setTestFixtures(() => 'Iframe error');
        const state = getInitialState();
        const store = initStore(state);
        await expect(() => store.dispatch(init())).rejects.toThrow('Iframe error');
        require('@trezor/connect').setTestFixtures(undefined);
    });

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState();
        const store = initStore(state);
        expect(() => store.dispatch(init())).not.toThrow();

        const actions = store.getActions();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { emit } = require('@trezor/connect');

        emit(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(actions.pop()).toEqual({ type: DEVICE_EVENT });
        emit(UI_EVENT, { type: UI_EVENT });
        expect(actions.pop()).toEqual({ type: UI_EVENT });
        emit(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(actions.pop()).toEqual({ type: TRANSPORT_EVENT });
        emit(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(actions.pop()).toEqual({ type: BLOCKCHAIN_EVENT });

        process.env.SUITE_TYPE = defaultSuiteType;
    });

    it('Wrapped method', async () => {
        const state = getInitialState();
        const store = initStore(state);
        await store.dispatch(init());
        await require('@trezor/connect').default.getFeatures();
        const actions = store.getActions();
        // check actions in reversed order
        expect(actions.pop()).toEqual({
            type: SUITE.LOCK_DEVICE,
            payload: false,
        });
        expect(actions.pop()).toEqual({
            type: SUITE.LOCK_DEVICE,
            payload: true,
        });
    });
});
