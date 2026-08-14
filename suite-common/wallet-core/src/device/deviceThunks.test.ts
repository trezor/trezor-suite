import { combineReducers } from '@reduxjs/toolkit';

import {
    type BluetoothDeviceCommon,
    prepareBluetoothReducerCreator,
} from '@suite-common/bluetooth';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { prepareThpReducer } from '@suite-common/thp';

import { forgetPersistentDataPreloadedStateFixture } from './__fixtures__/forgetPersistentDataPreloadedState';
import { forgetDevicePersistentDataThunk, handleDeviceDisconnect } from './deviceThunks';

const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
const bluetoothReducer = prepareBluetoothReducerCreator<BluetoothDeviceCommon>()(
    extraDependenciesCommonMock,
);
const thpReducer = prepareThpReducer(extraDependenciesCommonMock);

const initStore = () =>
    configureMockStore({
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

describe(handleDeviceDisconnect.name, () => {
    const UPDATED_DEVICE = mockSuiteDevice({ path: '1', connected: true, remember: false });
    const OTHER_WALLET = mockSuiteDevice(
        { path: '', connected: false, remember: true },
        { device_id: 'other-device' },
    );

    const initDisconnectStore = (firmware: { status: string; cachedDevice?: TrezorDevice }) =>
        configureMockStore({
            reducer: (state: any) => state,
            preloadedState: {
                device: {
                    devices: [OTHER_WALLET],
                    selectedDevice: UPDATED_DEVICE,
                },
                firmware,
            },
        });

    it('keeps the selection on the device that is being updated while it reboots', async () => {
        const store = initDisconnectStore({ status: 'done', cachedDevice: UPDATED_DEVICE });

        await store.dispatch(handleDeviceDisconnect(UPDATED_DEVICE));

        expect(
            store.getActions().some(action => action.type === deviceActions.selectDevice.type),
        ).toBe(false);
    });

    it('hands the selection over when no firmware update is running', async () => {
        const store = initDisconnectStore({ status: 'initial' });

        await store.dispatch(handleDeviceDisconnect(UPDATED_DEVICE));

        expect(
            store.getActions().some(action => action.type === deviceActions.selectDevice.type),
        ).toBe(true);
    });
});
