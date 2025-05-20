import { BluetoothDeviceCommon } from './bluetoothReducer';

export const deserializeBluetoothDeviceSerialization = <
    TBluetoothDevice extends BluetoothDeviceCommon,
>(
    it: TBluetoothDevice,
): TBluetoothDevice => ({
    ...it, // Because deserialization happens in the common code, we have to all what is stored is OK to be loaded

    // However, for defensive programing we reset some common fields we know they have to be reset
    connected: false,
    connectionStatus: { type: 'disconnected' },
});
