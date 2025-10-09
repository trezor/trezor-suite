import { DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export const isBluetoothDeviceConnected = (device: DesktopBluetoothDevice) =>
    ['paired', 'connected'].includes(device.connectionStatus.type);
