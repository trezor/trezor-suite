import {
    selectAdapterStatus,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { NativeBluetoothRootState } from './bluetoothSlice';

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeBluetoothRootState>();

export const selectBluetoothPermissionStatus = (state: NativeBluetoothRootState) =>
    state.bluetooth.permissionStatus;

export const selectBluetoothAdapterStatus = (state: NativeBluetoothRootState) =>
    selectAdapterStatus(state);

export const selectKnownBluetoothDevices = (state: NativeBluetoothRootState) =>
    selectKnownDevices(state);

export const selectHasKnownBluetoothDevices = createMemoizedSelector(
    [selectKnownBluetoothDevices],
    knownBluetoothDevices => knownBluetoothDevices.length > 0,
);

export const selectNearbyBluetoothDevices = createMemoizedSelector(
    [selectNearbyDevices],
    nearbyDevices => nearbyDevices ?? [],
);

export const selectUnknownNearbyBluetoothDevices = createMemoizedSelector(
    [selectNearbyBluetoothDevices, selectKnownBluetoothDevices],
    (nearbyBluetoothDevices, knownBluetoothDevices) =>
        nearbyBluetoothDevices.filter(nearbyDevice =>
            knownBluetoothDevices.every(knownDevice => nearbyDevice.id !== knownDevice.id),
        ),
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
