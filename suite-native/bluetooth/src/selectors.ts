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

export const selectNearbyPairableBluetoothDevices = createMemoizedSelector(
    [selectNearbyBluetoothDevices],
    nearbyBluetoothDevices =>
        nearbyBluetoothDevices.filter(
            ({ manufacturerData }) => manufacturerData.filterPolicy?.pairing === true,
        ),
);

export const selectKnownConnectableBluetoothDevices = createMemoizedSelector(
    [selectNearbyBluetoothDevices, selectKnownBluetoothDevices],
    (nearbyBluetoothDevices, knownBluetoothDevices) =>
        nearbyBluetoothDevices.filter(
            ({ id, manufacturerData, connectionStatus }) =>
                knownBluetoothDevices.some(knownDevice => knownDevice.id === id) &&
                manufacturerData.filterPolicy?.pairing !== true &&
                connectionStatus.type === 'disconnected',
        ),
);
