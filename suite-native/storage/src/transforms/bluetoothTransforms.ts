import { createTransform } from 'redux-persist';

import { BluetoothDevice } from '@trezor/transport-native-bluetooth';

export const bluetoothPersistTransform = createTransform<BluetoothDevice[], BluetoothDevice[]>(
    inboundState =>
        inboundState.map(device => ({
            ...device,
            connectionStatus: { type: 'disconnected' },
        })),
    undefined,
    { whitelist: ['knownDevices'] },
);
