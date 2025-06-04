import {
    prepareSelectAllDevices,
    selectAdapterStatus,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { NativeBluetoothRootState } from './bluetoothSlice';
import { BluetoothDevice } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeBluetoothRootState>();

export const selectBluetoothPermissionStatus = (state: NativeBluetoothRootState) =>
    state.bluetooth.permissionStatus;

export const selectBluetoothAdapterStatus = (state: NativeBluetoothRootState) =>
    selectAdapterStatus(state);

export const selectKnownBluetoothDevices = (state: NativeBluetoothRootState) =>
    selectKnownDevices(state);

export const selectIsKnownBluetoothDevice = createMemoizedSelector(
    [selectKnownBluetoothDevices, (_, device: BluetoothDevice) => device],
    (knownBluetoothDevices, device) => knownBluetoothDevices.some(d => d.id === device.id),
);

export const selectNearbyBluetoothDevices = createMemoizedSelector(
    [selectNearbyDevices],
    nearbyDevices => nearbyDevices ?? [],
);

export const selectKnownConnectableBluetoothDevices = createMemoizedSelector(
    [selectNearbyBluetoothDevices, selectKnownBluetoothDevices],
    (nearbyBluetoothDevices, knownBluetoothDevices) =>
        nearbyBluetoothDevices.filter(nearbyDevice =>
            knownBluetoothDevices.some(
                knownDevice =>
                    nearbyDevice.id === knownDevice.id &&
                    knownDevice.connectionStatus.type === 'disconnected',
            ),
        ),
);

export const selectAllBluetoothDevices = prepareSelectAllDevices<BluetoothDevice>();
