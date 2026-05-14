import { type WithBluetoothRootState } from './desktopBluetoothReducer';

export const selectConnectingDevices = (state: WithBluetoothRootState) =>
    state.bluetooth.connectingDeviceIds;

export const selectIsUnpairingDevice = (state: WithBluetoothRootState) =>
    state.bluetooth.isUnpairingDevice;

export const selectIsManualPairingRequired = (state: WithBluetoothRootState) =>
    state.bluetooth.isManualPairingRequired;
