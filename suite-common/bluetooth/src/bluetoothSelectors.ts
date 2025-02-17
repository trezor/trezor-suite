import { BluetoothDevice, BluetoothState } from './bluetoothReducerCreator';

type State<T extends BluetoothDevice> = {
    bluetooth: BluetoothState<T>;
};

export const selectAdapterStatus = <T extends BluetoothDevice>(state: State<T>) =>
    state.bluetooth.adapterStatus;

export const selectKnownDevices = <T extends BluetoothDevice>(state: State<T>) =>
    state.bluetooth.knownDevices;

export const selectNearbyDevices = <T extends BluetoothDevice>(state: State<T>) =>
    state.bluetooth.nearbyDevices;

export const selectScanStatus = <T extends BluetoothDevice>(state: State<T>) =>
    state.bluetooth.scanStatus;
