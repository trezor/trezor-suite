import { DEVICE_EVENT, UI_EVENT, TRANSPORT_EVENT, BLOCKCHAIN_EVENT } from '@trezor/connect';
import { connectInitThunk } from '@suite-common/connect-init';
import { testMocks } from '@suite-common/test-utils';
import { prepareDeviceReducer } from '@suite-common/wallet-core';

import { configureStore } from 'src/support/tests/configureStore';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { SUITE } from 'src/actions/suite/constants';
import { extraDependencies } from 'src/support/extraDependencies';

const deviceReducer = prepareDeviceReducer(extraDependencies);

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
export const getInitialState = (suite?: Partial<SuiteState>, device?: Partial<DevicesState>) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    device: { devices: device?.devices || [] },
    wallet: {
        settings: {
            enabledNetworks: [],
        },
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, device } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().device = deviceReducer(device, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('TrezorConnect Actions', () => {
    it('Success', () => {
        const state = getInitialState();
        const store = initStore(state);
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();
    });

    it('Error', async () => {
        testMocks.setTrezorConnectFixtures(() => {
            throw new Error('Iframe error');
        });
        const state = getInitialState();
        const store = initStore(state);
        try {
            await store.dispatch(connectInitThunk()).unwrap();
        } catch (error) {
            expect(error.message).toEqual('Iframe error');
        }
    });

    it('TypedError', async () => {
        testMocks.setTrezorConnectFixtures(() => ({
            message: 'Iframe error',
            code: 'SomeCode',
        }));
        const state = getInitialState();
        const store = initStore(state);
        try {
            await store.dispatch(connectInitThunk()).unwrap();
        } catch (error) {
            expect(error.message).toEqual('SomeCode: Iframe error');
        }
    });

    it('Error as string', async () => {
        testMocks.setTrezorConnectFixtures(() => 'Iframe error');
        const state = getInitialState();
        const store = initStore(state);
        try {
            await store.dispatch(connectInitThunk()).unwrap();
        } catch (error) {
            expect(error.message).toEqual('Iframe error');
        }
    });

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const state = getInitialState();
        const store = initStore(state);
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();

        const actions = store.getActions();
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        emitTestEvent(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(actions.pop()).toEqual({ type: DEVICE_EVENT });
        emitTestEvent(UI_EVENT, { type: UI_EVENT });
        expect(actions.pop()).toEqual({ type: UI_EVENT });
        emitTestEvent(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(actions.pop()).toEqual({ type: TRANSPORT_EVENT });
        emitTestEvent(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(actions.pop()).toEqual({ type: BLOCKCHAIN_EVENT });

        process.env.SUITE_TYPE = defaultSuiteType;
    });

    it('Wrapped method', async () => {
        const state = getInitialState();
        const store = initStore(state);
        await store.dispatch(connectInitThunk());
        await testMocks.getTrezorConnectMock().getFeatures();
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
