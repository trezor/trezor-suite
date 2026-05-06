import { combineReducers } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { asBluetoothDeviceId } from '@trezor/connect';

import { type DesktopBluetoothDevice } from '../DesktopBluetoothDevice';
import { bluetoothSlice, initialDesktopBluetoothState } from '../desktopBluetoothReducer';
import { removeNonResponsiveNearbyDevicesThunk } from '../removeNonResponsiveNearbyDevicesThunk';
import { createMockedBluetoothDevice } from './createMockedBluetoothDevice';

const NOW = 8_000;

const bluetoothReducer = bluetoothSlice.prepareReducer(extraDependenciesCommonMock);

const responsiveDevice: DesktopBluetoothDevice = createMockedBluetoothDevice({
    id: asBluetoothDeviceId('responsive'),
    name: 'Responsive',
    lastUpdatedTimestamp: NOW - 500,
    connectionStatus: { type: 'paired' },
});

const nonResponsiveDevice: DesktopBluetoothDevice = createMockedBluetoothDevice({
    id: asBluetoothDeviceId('non-responsive'),
    name: 'NonResponsive',
    lastUpdatedTimestamp: NOW - 60_000,
    connectionStatus: { type: 'paired' },
});

const buildStore = (nearbyDevices: DesktopBluetoothDevice[]) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({ bluetooth: bluetoothReducer }),
        preloadedState: {
            bluetooth: { ...initialDesktopBluetoothState, nearbyDevices },
        },
    });

describe('removeNonResponsiveNearbyDevicesThunk', () => {
    beforeAll(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('does not dispatch nearbyDevicesUpdateAction when nothing is filtered out', () => {
        const store = buildStore([responsiveDevice]);

        store.dispatch(removeNonResponsiveNearbyDevicesThunk());

        const updateActions = store
            .getActions()
            .filter(action => action.type === bluetoothActions.nearbyDevicesUpdateAction.type);
        expect(updateActions).toHaveLength(0);
    });

    it('dispatches nearbyDevicesUpdateAction when at least one device is filtered out', () => {
        const store = buildStore([responsiveDevice, nonResponsiveDevice]);

        store.dispatch(removeNonResponsiveNearbyDevicesThunk());

        const updateActions = store
            .getActions()
            .filter(action => action.type === bluetoothActions.nearbyDevicesUpdateAction.type);
        expect(updateActions).toHaveLength(1);
        expect(updateActions[0].payload.nearbyDevices).toEqual([responsiveDevice]);
    });
});
