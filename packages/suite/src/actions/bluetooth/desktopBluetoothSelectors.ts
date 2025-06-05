import { WithBluetoothRootState } from './desktopBluetoothReducer';

export const selectConnectingDevices = (state: WithBluetoothRootState) =>
    state.bluetooth.connectingDeviceIds;

export const selectUnpairedDeviceNeedsManualOsRemoval = (state: WithBluetoothRootState) =>
    state.bluetooth.unpairedDeviceNeedsManualOsRemoval;

export const selectIsBluetoothListOpen = (state: WithBluetoothRootState) =>
    state.bluetooth.isBluetoothListOpen;
