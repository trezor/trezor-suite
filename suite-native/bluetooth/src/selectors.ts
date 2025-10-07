import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectIsDeviceOsUnpairingRequired,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';

import { NativeBluetoothRootState } from './bluetoothSlice';

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeBluetoothRootState>();

export const selectBluetoothAutoConnectPolicy = (state: NativeBluetoothRootState) =>
    selectAutoConnectPolicy(state);

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
    [selectNearbyBluetoothDevices, selectKnownBluetoothDevices],
    (nearbyBluetoothDevices, knownBluetoothDevices) =>
        returnStableArrayIfEmpty(
            nearbyBluetoothDevices.filter(
                ({ id, manufacturerData }) =>
                    knownBluetoothDevices.every(knownDevice => knownDevice.id !== id) &&
                    manufacturerData.filterPolicy?.pairing === true,
            ),
        ),
);

export const selectKnownConnectableBluetoothDevices = createMemoizedSelector(
    [selectNearbyBluetoothDevices, selectKnownBluetoothDevices, selectBluetoothAutoConnectPolicy],
    (nearbyBluetoothDevices, knownBluetoothDevices, autoConnectPolicy) =>
        returnStableArrayIfEmpty(
            nearbyBluetoothDevices.filter(
                ({ id, manufacturerData, connectionStatus }) =>
                    knownBluetoothDevices.some(knownDevice => knownDevice.id === id) &&
                    autoConnectPolicy[id]?.type !== 'autoconnect-disabled' &&
                    manufacturerData.filterPolicy?.pairing !== true &&
                    manufacturerData.filterPolicy?.user_disconnected !== true &&
                    connectionStatus.type === 'disconnected',
            ),
        ),
);

export const selectIsBluetoothDeviceOsUnpairingRequired = (state: NativeBluetoothRootState) =>
    selectIsDeviceOsUnpairingRequired(state);
