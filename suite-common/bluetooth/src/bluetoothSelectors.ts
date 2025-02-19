import { createWeakMapSelector } from '@suite-common/redux-utils';

import { BluetoothDeviceCommon, BluetoothDeviceState, BluetoothState } from './bluetoothReducer';

type State<T extends BluetoothDeviceCommon> = {
    bluetooth: BluetoothState<T>;
};

export const selectAdapterStatus = <T extends BluetoothDeviceCommon>(state: State<T>) =>
    state.bluetooth.adapterStatus;

export const selectKnownDevices = <T extends BluetoothDeviceCommon>(state: State<T>) =>
    state.bluetooth.knownDevices;

export const prepareSelectAllDevices = <T extends BluetoothDeviceCommon>() =>
    createWeakMapSelector.withTypes<State<T>>()(
        [state => state.bluetooth.nearbyDevices, state => state.bluetooth.knownDevices],
        (nearbyDevices, knownDevices) => {
            const map = new Map<string, BluetoothDeviceState<T>>();
            knownDevices.forEach(knownDevice => {
                map.set(knownDevice.id, { device: knownDevice, status: null });
            });

            nearbyDevices.forEach(nearbyDevice => {
                if (!map.has(nearbyDevice.device.id)) {
                    map.set(nearbyDevice.device.id, nearbyDevice);
                }
            });

            return Array.from(map.values());
        },
    );

export const selectScanStatus = <T extends BluetoothDeviceCommon>(state: State<T>) =>
    state.bluetooth.scanStatus;
