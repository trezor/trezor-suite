import { createWeakMapSelector } from '@suite-common/redux-utils';

import { BluetoothState } from './bluetoothReducer';
import { BluetoothDeviceCommon, BluetoothFilterPolicy } from './types';

export type WithBluetoothState<T extends BluetoothDeviceCommon> = {
    bluetooth: BluetoothState<T>;
};

export const selectAdapterStatus = <T extends BluetoothDeviceCommon>(
    state: WithBluetoothState<T>,
) => state.bluetooth.adapterStatus;

export const selectKnownDevices = <T extends BluetoothDeviceCommon>(state: WithBluetoothState<T>) =>
    state.bluetooth.knownDevices;

export const selectConnectingDevices = <T extends BluetoothDeviceCommon>(
    state: WithBluetoothState<T>,
) => state.bluetooth.connectingDeviceIds;

export const selectNearbyDevices = <T extends BluetoothDeviceCommon>(
    state: WithBluetoothState<T>,
) => state.bluetooth.nearbyDevices;

export const selectUnpairedDeviceNeedsManualOsRemoval = <T extends BluetoothDeviceCommon>(
    state: WithBluetoothState<T>,
) => state.bluetooth.unpairedDeviceNeedsManualOsRemoval;

export const selectIsBluetoothListOpen = <T extends BluetoothDeviceCommon>(
    state: WithBluetoothState<T>,
) => state.bluetooth.isBluetoothListOpen;

/**
 * We need to have generic `createWeakMapSelector.withTypes` so we need to wrap it into Higher Order Function,
 * but we need to make sure it is called only **once** to not break the memoization. So it is named
 * `prepareSelectAllDevices` and shall be called **outside** of the component to create a selector with
 *  a concrete type:
 *
 * For example, `const selectAllDevices = prepareSelectAllDevices<ConcreteBluetoothDevice>();`
 */
export const prepareSelectAllDevices = <T extends BluetoothDeviceCommon>() =>
    createWeakMapSelector.withTypes<WithBluetoothState<T>>()(
        [state => state.bluetooth.nearbyDevices, state => state.bluetooth.knownDevices],
        (nearbyDevices, knownDevices) => {
            const map = new Map<string, T>();

            knownDevices.forEach(knownDevice => map.set(knownDevice.id, knownDevice));

            const nearbyDevicesCopy = (nearbyDevices ?? []).filter(
                d => d.manufacturerData.filterPolicy === BluetoothFilterPolicy.UNFILTERED,
            );
            nearbyDevicesCopy.forEach(nearbyDevice => {
                map.delete(nearbyDevice.id); // Delete and re-add to change the order, replace would keep original order
                map.set(nearbyDevice.id, nearbyDevice);
            });

            return Array.from(map.values());
        },
    );

export const selectScanStatus = <T extends BluetoothDeviceCommon>(state: WithBluetoothState<T>) =>
    state.bluetooth.scanStatus;
