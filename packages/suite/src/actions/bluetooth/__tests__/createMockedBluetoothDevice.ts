import { createBluetoothDeviceCommon } from '@suite-common/bluetooth/src/support/mocks';

import { type DesktopBluetoothDevice } from '../DesktopBluetoothDevice';

export const createMockedBluetoothDevice = (
    partialDevice: Partial<DesktopBluetoothDevice>,
): DesktopBluetoothDevice => {
    const bluetoothDeviceCommon = createBluetoothDeviceCommon(partialDevice);

    return {
        ...bluetoothDeviceCommon,
        rssi: partialDevice.rssi ?? -35, // -35 dBm is a good strong signal
        macAddress: partialDevice.macAddress ?? '00:11:22:33:44:55',
        paired: partialDevice.paired ?? false,
        connected: partialDevice.connected ?? false,
        connectionStatus: partialDevice.connectionStatus ?? { type: 'connected' },
        lastUpdatedTimestamp: partialDevice.lastUpdatedTimestamp ?? Date.now(),
    };
};
