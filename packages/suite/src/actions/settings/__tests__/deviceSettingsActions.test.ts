import { testMocks } from '@suite-common/test-utils';
import { deviceActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { configureStore } from 'src/support/tests/configureStore';
import suiteReducer from 'src/reducers/suite/suiteReducer';

import fixtures, {
    DeviceSettingsFixtureState,
    deviceReducer,
} from '../__fixtures__/deviceSettings';

const { getSuiteDevice } = testMocks;

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

const DEVICE = getSuiteDevice({ path: '1', connected: true });

const getInitialState = (state: Partial<DeviceSettingsFixtureState> = {}) => ({
    suite: {
        ...suiteReducer(undefined, { type: '@suite/init' }),
    },
    device: {
        devices: state.device?.devices ?? [DEVICE],
        selectedDevice: DEVICE,
    },
    router: {},
});

const mockStore = configureStore<DeviceSettingsFixtureState, any>();

const initStore = (state: DeviceSettingsFixtureState) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, device } = store.getState();
        // process action in reducers
        store.getState().suite = suiteReducer(suite, action);
        store.getState().device = deviceReducer(device, action);
        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('DeviceSettings Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(getInitialState(f.initialState));
            // wipe device tests require "device-change" event from "@trezor/connect"
            // this action have influence on reducers and forget device process
            const mock = () => {
                if (f.deviceChange) {
                    store.dispatch(deviceActions.deviceChanged(f.deviceChange));
                    store.dispatch(deviceActions.updateSelectedDevice(f.deviceChange));
                }

                return Promise.resolve(f.mocks) as any;
            };
            jest.spyOn(TrezorConnect, 'applySettings').mockImplementation(mock);
            jest.spyOn(TrezorConnect, 'wipeDevice').mockImplementation(mock);
            jest.spyOn(TrezorConnect, 'changePin').mockImplementation(mock);

            await store.dispatch(f.action());

            if (f.result) {
                if (f.result.actions) {
                    expect(store.getActions()).toMatchObject(f.result.actions);
                }
            }
        });
    });
});
