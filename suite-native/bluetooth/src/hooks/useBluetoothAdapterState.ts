import { useEffect, useState } from 'react';
import { State as BluetoothAdapterState } from 'react-native-ble-plx';

import { nativeBleManager } from '@trezor/transport-native-ble';

export const useBluetoothAdapterState = () => {
    const [bluetoothAdapterState, setState] = useState<BluetoothAdapterState>(
        BluetoothAdapterState.Unknown,
    );

    useEffect(() => {
        nativeBleManager.bleManager.state().then(newState => {
            setState(newState);
        });

        const subscription = nativeBleManager.bleManager.onStateChange(newState => {
            setState(newState);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const turnOnBluetoothAdapter = async () => {
        await nativeBleManager.bleManager.enable();
    };

    return {
        bluetoothAdapterState,
        turnOnBluetoothAdapter,
    };
};
