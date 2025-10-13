import { DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export const isBluetoothDeviceConnected = (device: DesktopBluetoothDevice) =>
    ['paired', 'pairing', 'connecting', 'connected'].includes(device.connectionStatus.type);
