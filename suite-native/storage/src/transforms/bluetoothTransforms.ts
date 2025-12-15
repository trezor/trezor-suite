import { createTransform } from 'redux-persist';

import { type BluetoothDevice } from '@trezor/transport-native-bluetooth';

export const bluetoothPersistTransform = createTransform<BluetoothDevice[], BluetoothDevice[]>(
    inboundState => {
        if (!inboundState) return inboundState;

        return inboundState.map(device => ({
            ...device,
            connectionStatus: { type: 'disconnected' },
        }));
    },

    undefined,
    { whitelist: ['knownDevices'] },
);
