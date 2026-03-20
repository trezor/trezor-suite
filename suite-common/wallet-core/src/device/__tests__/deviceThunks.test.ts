import { combineReducers } from '@reduxjs/toolkit';

import {
    type BluetoothDeviceCommon,
    prepareBluetoothReducerCreator,
} from '@suite-common/bluetooth';
import { prepareDeviceReducer } from '@suite-common/device';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { prepareThpReducer } from '@suite-common/thp';

import { forgetPersistentDataPreloadedStateFixture } from '../__fixtures__/forgetPersistentDataPreloadedState';
import { forgetDevicePersistentDataThunk } from '../deviceThunks';

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
