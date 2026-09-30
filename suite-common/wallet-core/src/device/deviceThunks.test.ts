import { combineReducers } from '@reduxjs/toolkit';

import {
    type BluetoothDeviceCommon,
    prepareBluetoothReducerCreator,
} from '@suite-common/bluetooth';
import { type DeviceReducerState, deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { preparePersistentDeviceDataReducer } from '@suite-common/persistent-device-data';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot, filterThunkActionTypes } from '@suite-common/test-utils';
import { type ThpRootState, prepareThpReducer } from '@suite-common/thp';
import { DEVICE } from '@trezor/connect';

import { forgetPersistentDataPreloadedStateFixture } from './__fixtures__/forgetPersistentDataPreloadedState';
import { handleDeviceDisconnectFixture } from './__fixtures__/handleDeviceDisconnect';
import {
    type ForgetDevicePersistentDataThunkDeps,
    type ForgetDevicePersistentDataThunkState,
    type HandleDeviceDisconnectThunkState,
    forgetDevicePersistentDataThunk,
    handleDeviceDisconnectThunk,
} from './deviceThunks';

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});
const bluetoothReducer = prepareBluetoothReducerCreator<BluetoothDeviceCommon>()({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const thpReducer = prepareThpReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const persistentDeviceDataReducer = preparePersistentDeviceDataReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadPersistentDeviceData: mockReducer() },
});
const extra: ForgetDevicePersistentDataThunkDeps = {
    thunks: {
        forgetBluetoothDevice: jest.fn(() => () => undefined),
    },
};

// THP is extra because this test also asserts cleanup handled by the THP reducer.
type State = ForgetDevicePersistentDataThunkState & ThpRootState;

const initStore = () =>
    createTestCompositionRoot<ForgetDevicePersistentDataThunkDeps, State>({
        extra,
        reducer: combineReducers({
            bluetooth: bluetoothReducer,
            device: deviceReducer,
            thp: thpReducer,
            persistentDeviceData: persistentDeviceDataReducer,
        }),
        preloadedState: forgetPersistentDataPreloadedStateFixture,
    }).services.store;

describe(forgetDevicePersistentDataThunk.name, () => {
    it('forgets a single device data with Bluetooth and THP', async () => {
        const store = initStore();
        await store.dispatch(forgetDevicePersistentDataThunk({ deviceId: 'device-id-1' }));
        const state = store.getState();

        // device-id-1 persistent data is removed, others remain
        expect(state.persistentDeviceData.devices.map(d => d.device_id)).toEqual([
            'device-id-2',
            'device-id-3',
        ]);
        // BT known device 'bt-id-1' is removed, others remain
        expect(state.bluetooth.knownDevices.map(d => d.id)).toEqual(['bt-id-4']);
        // THP credentials '1A', '1B' are removed, '1C' was not found, others remain
        expect(state.thp.credentials.map(c => c.credential)).toEqual(['2', '4']);
    });

    it('forgets a single device data with THP, but no Bluetooth data', async () => {
        const store = initStore();
        await store.dispatch(forgetDevicePersistentDataThunk({ deviceId: 'device-id-2' }));
        const state = store.getState();

        expect(state.persistentDeviceData.devices.map(d => d.device_id)).toEqual([
            'device-id-1',
            'device-id-3',
        ]);
        expect(state.bluetooth).toEqual(forgetPersistentDataPreloadedStateFixture.bluetooth);
        expect(state.thp.credentials.map(c => c.credential)).toEqual(['1A', '1B', '4']);
    });

    it('forgets a single device data with pointer to non-existent data', async () => {
        const store = initStore();
        await store.dispatch(forgetDevicePersistentDataThunk({ deviceId: 'device-id-3' }));
        const state = store.getState();

        expect(state.persistentDeviceData.devices.map(d => d.device_id)).toEqual([
            'device-id-1',
            'device-id-2',
        ]);
        expect(state.bluetooth).toEqual(forgetPersistentDataPreloadedStateFixture.bluetooth);
        expect(state.thp).toEqual(forgetPersistentDataPreloadedStateFixture.thp);
    });

    it('does nothing for a non-existent device', async () => {
        const store = initStore();
        await store.dispatch(forgetDevicePersistentDataThunk({ deviceId: 'device-id-4' }));
        const state = store.getState();
        expect(state).toEqual(forgetPersistentDataPreloadedStateFixture);
    });
});

const getDisconnectInitialState = (state?: {
    device?: Partial<DeviceReducerState>;
}): HandleDeviceDisconnectThunkState => ({
    device: {
        ...deviceReducer(undefined, { type: 'foo' }),
        ...state?.device,
    },
});

const initDisconnectStore = (state: HandleDeviceDisconnectThunkState) =>
    createTestCompositionRoot<
        ForgetDevicePersistentDataThunkDeps,
        HandleDeviceDisconnectThunkState
    >({
        extra,
        reducer: combineReducers({
            device: deviceReducer,
        }),
        preloadedState: state,
    }).services.store;

describe(handleDeviceDisconnectThunk.name, () => {
    handleDeviceDisconnectFixture.forEach(fixture => {
        it(`handleDeviceDisconnect: ${fixture.description}`, async () => {
            const state = getDisconnectInitialState(fixture.state);
            const store = initDisconnectStore(state);

            store.dispatch({
                type: DEVICE.DISCONNECT,
                payload: fixture.device,
            });
            await store.dispatch(handleDeviceDisconnectThunk(fixture.device));

            const actions = filterThunkActionTypes(store.getActions());

            if (!fixture.result) {
                expect(actions.pop()?.type).toEqual(deviceActions.deviceDisconnect.type);
            } else {
                const action = actions.pop();

                if (fixture.result.type) {
                    expect(action?.type).toEqual(fixture.result.type);
                }
                expect(action?.payload).toEqual(fixture.result.payload);
            }
        });
    });
});
