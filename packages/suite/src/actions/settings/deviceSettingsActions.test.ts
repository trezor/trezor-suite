import { initialDesktopBluetoothState } from '@suite/bluetooth';
import { openModal } from '@suite/modal';
import { suiteSettingsInitialState } from '@suite/settings';
import { mockForgetBluetoothDevice } from '@suite-common/bluetooth/mocks';
import { deviceActions, deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { mockReportSecurityCheck, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, filterThunkActionTypes } from '@suite-common/test-utils';
import { type ForgetDevicePersistentDataThunkState } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import fixtures, {
    type DeviceSettingsActionsTestDeps,
    type DeviceSettingsFixtureState,
    deviceReducer,
} from './__fixtures__/deviceSettingsActions';
import { type ResetDeviceThunkState } from './deviceSettingsActions';

const DEVICE = mockSuiteDevice({ path: '1', connected: true });
type State = ForgetDevicePersistentDataThunkState & ResetDeviceThunkState;

const getInitialState = (state: Partial<DeviceSettingsFixtureState> = {}): State => ({
    suiteSettings: suiteSettingsInitialState,
    device: {
        ...deviceInitialState,
        devices: state.device?.devices ?? [DEVICE],
        selectedDevice: state.device?.selectedDevice ?? DEVICE,
    },
    persistentDeviceData: persistentDeviceDataInitialState,
    messageSystem: {
        ...messageSystemInitialState,
        validMessages: { ...messageSystemInitialState.validMessages, feature: [] },
    },
    bluetooth: { ...initialDesktopBluetoothState, knownDevices: [] },
});

const mockStore = (preloadedState: State) =>
    createTestCompositionRoot<DeviceSettingsActionsTestDeps, State>({
        extra: {
            actions: { openModal },
            thunks: { forgetBluetoothDevice: mockForgetBluetoothDevice() },
        },
        reducer: (state = preloadedState, action) => ({
            ...state,
            device: { ...state.device, ...deviceReducer(state.device, action) },
        }),
        preloadedState,
        services: () => ({ reportSecurityCheck: mockReportSecurityCheck() }),
    }).services.store;

describe('DeviceSettings Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = mockStore(getInitialState(f.initialState));
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
            jest.spyOn(TrezorConnect, 'resetDevice').mockImplementation(mock);

            await store.dispatch(f.action());

            if (f.result) {
                if (f.result.actions) {
                    expect(filterThunkActionTypes(store.getActions())).toMatchObject(
                        f.result.actions,
                    );
                }
            }
        });
    });
});
