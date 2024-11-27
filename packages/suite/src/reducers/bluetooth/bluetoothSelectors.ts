import { AppState } from '../store';

export const selectBluetoothEnabled = (state: AppState) => state.bluetooth.isBluetoothEnabled;

export const selectBluetoothDeviceList = (state: AppState) => state.bluetooth.deviceList;

export const selectBluetoothScanStatus = (state: AppState) => state.bluetooth.scanStatus;
