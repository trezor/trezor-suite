import { createWeakMapSelector } from '@suite-common/redux-utils';

import { BluetoothDeviceCommon, BluetoothDeviceState, BluetoothState } from './bluetoothReducer';

export type WithBluetoothState<T extends BluetoothDeviceCommon> = {
    bluetooth: BluetoothState<T>;
};

export const selectAdapterStatus = <T extends BluetoothDeviceCommon>(
    state: WithBluetoothState<T>,
) => state.bluetooth.adapterStatus;

export const selectKnownDevices = <T extends BluetoothDeviceCommon>(state: WithBluetoothState<T>) =>
    state.bluetooth.knownDevices;

/**
 * We need to have generic `createWeakMapSelector.withTypes` so we need to wrap it into Higher Order Function,
 * but we need to make sure it is called only **once** to not break the memoization. So it is named
 * `prepareSelectAllDevices` and shall be called **outside** of the component to create a selector with
 * concrete type:
 *
 * For example: `const selectAllDevices = prepareSelectAllDevices<ConcreteBluetoothDevice>();`
 */
export const prepareSelectAllDevices = <T extends BluetoothDeviceCommon>() =>
    createWeakMapSelector.withTypes<WithBluetoothState<T>>()(
        [state => state.bluetooth.nearbyDevices, state => state.bluetooth.knownDevices],
        (nearbyDevices, knownDevices) => {
            const map = new Map<string, BluetoothDeviceState<T>>();

            nearbyDevices.forEach(nearbyDevice => {
                map.set(nearbyDevice.device.id, nearbyDevice);
            });

            knownDevices.forEach(knownDevice => {
                if (!map.has(knownDevice.id)) {
                    map.set(knownDevice.id, { device: knownDevice, status: null });
                }
            });

            return Array.from(map.values()).sort(
                (a, b) => b.device.lastUpdatedTimestamp - a.device.lastUpdatedTimestamp,
            );
        },
    );

export const selectScanStatus = <T extends BluetoothDeviceCommon>(state: WithBluetoothState<T>) =>
    state.bluetooth.scanStatus;
