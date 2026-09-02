import { createBluetoothDeviceCommon } from '@suite-common/bluetooth/mocks';

import { type DesktopBluetoothDevice } from '../src/actions/bluetooth/DesktopBluetoothDevice';

export const mockDesktopBluetoothDevice = (
    partialDevice: Partial<DesktopBluetoothDevice>,
): DesktopBluetoothDevice => {
    const bluetoothDeviceCommon = createBluetoothDeviceCommon(partialDevice);

    return {
        ...bluetoothDeviceCommon,
        rssi: -35, // -35 dBm is a good strong signal
        macAddress: '00:11:22:33:44:55',
        paired: false,
        connectionStatus: { type: 'connected' },
        ...partialDevice,
    };
};
