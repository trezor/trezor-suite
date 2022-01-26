/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable global-require */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fixtures from '../__fixtures__/deviceSettings';
import suiteReducer from '@suite-reducers/suiteReducer';
import deviceReducer from '@suite-reducers/deviceReducer';

const { getSuiteDevice } = global.JestMocks;

jest.mock('trezor-connect', () => {
    let fixture: { success: boolean; payload: any };
    let deviceChangeEvent = () => {};

    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            applySettings: () =>
                new Promise(resolve => {
                    deviceChangeEvent();
                    resolve(fixture);
                }),
            wipeDevice: () =>
                new Promise(resolve => {
                    deviceChangeEvent();
                    resolve(fixture);
                }),
            changePin: () =>
                new Promise(resolve => {
                    deviceChangeEvent();
                    resolve(fixture);
                }),
        },
        setTestFixtures: (f: typeof fixture) => {
            fixture = f;
        },
        setDeviceChangeEvent: (event: typeof deviceChangeEvent) => {
            deviceChangeEvent = event;
        },
        DEVICE: {
            CHANGED: 'device-changed',
        },
        TRANSPORT: {},
        BLOCKCHAIN: {},
    };
});

const DEVICE = getSuiteDevice({ path: '1', connected: true });

type State = {
    suite: ReturnType<typeof suiteReducer>;
    devices: ReturnType<typeof deviceReducer>;
};

export const getInitialState = (state: Partial<State> = {}) => ({
    suite: {
        ...suiteReducer(undefined, { type: '@suite/init' }),
        device: DEVICE,
    },
    devices: state.devices ?? [DEVICE],
    router: {},
});

const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, devices } = store.getState();
        // process action in reducers
        store.getState().suite = suiteReducer(suite, action);
        store.getState().devices = deviceReducer(devices, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('DeviceSettings Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));
            if (f.mocks) {
                require('trezor-connect').setTestFixtures(f.mocks);
            }
            // wipe device tests require "device-change" event from "trezor-connect"
            // this action have influence on reducers and forget device process
            if (f.deviceChange) {
                require('trezor-connect').setDeviceChangeEvent(() => {
                    store.dispatch({ type: 'device-changed', payload: f.deviceChange });
                    store.dispatch({
                        type: '@suite/update-selected-device',
                        payload: f.deviceChange,
                    });
                });
            }

            await store.dispatch(f.action());
            if (f.result) {
                if (f.result.actions) {
                    expect(store.getActions()).toMatchObject(f.result.actions);
                }
            }
        });
    });
});
