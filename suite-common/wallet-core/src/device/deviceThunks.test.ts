import { combineReducers } from '@reduxjs/toolkit';

import {
    type BluetoothDeviceCommon,
    prepareBluetoothReducerCreator,
} from '@suite-common/bluetooth';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore, filterThunkActionTypes } from '@suite-common/test-utils';
import { prepareThpReducer } from '@suite-common/thp';
import { DEVICE } from '@trezor/connect';

import { forgetPersistentDataPreloadedStateFixture } from './__fixtures__/forgetPersistentDataPreloadedState';
import { handleDeviceDisconnectFixture } from './__fixtures__/handleDeviceDisconnect';
import {
    type ForgetDevicePersistentDataThunkDeps,
    forgetDevicePersistentDataThunk,
    handleDeviceDisconnect,
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
const extra: ForgetDevicePersistentDataThunkDeps = {
    thunks: {
        forgetBluetoothDevice: jest.fn(() => () => undefined),
    },
};

const initStore = () =>
    createTestStore({
        extra,
        reducer: combineReducers({
            bluetooth: bluetoothReducer,
            device: deviceReducer,
            thp: thpReducer,
        }),
        preloadedState: forgetPersistentDataPreloadedStateFixture,
    });

describe(forgetDevicePersistentDataThunk.name, () => {
    it('forgets a single device data with Bluetooth and THP', async () => {
        const store = initStore();
        await store.dispatch(forgetDevicePersistentDataThunk({ deviceId: 'device-id-1' }));
        const state = store.getState();

        // device-id-1 persistent data is removed, others remain
        expect(state.device.persistentDeviceData.map(d => d.device_id)).toEqual([
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

        expect(state.device.persistentDeviceData.map(d => d.device_id)).toEqual([
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

        expect(state.device.persistentDeviceData.map(d => d.device_id)).toEqual([
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

type DisconnectState = {
    device: ReturnType<typeof deviceReducer>;
};

const getDisconnectInitialState = (state?: {
    device?: Partial<ReturnType<typeof deviceReducer>>;
}): DisconnectState => ({
    device: {
        ...deviceReducer(undefined, { type: 'foo' }),
        ...state?.device,
    },
});

const initDisconnectStore = (state: DisconnectState) =>
    createTestStore({
        extra,
        reducer: combineReducers({
            device: deviceReducer,
        }),
        preloadedState: state,
    });

describe(handleDeviceDisconnect.name, () => {
    handleDeviceDisconnectFixture.forEach(fixture => {
        it(`handleDeviceDisconnect: ${fixture.description}`, async () => {
            const state = getDisconnectInitialState(fixture.state);
            const store = initDisconnectStore(state);

            store.dispatch({
                type: DEVICE.DISCONNECT,
                payload: fixture.device,
            });
            await store.dispatch(handleDeviceDisconnect(fixture.device));

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
