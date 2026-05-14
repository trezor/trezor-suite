import { useCallback } from 'react';
import { AppState } from 'react-native';

import { type BleError, bluetoothManager } from '@trezor/transport-native-bluetooth';

export const useBluetoothScanner = () => {
    const startDeviceScan = useCallback((errorHandler?: (error: BleError) => void) => {
        bluetoothManager.startDeviceScan(errorHandler);

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                bluetoothManager.startDeviceScan(errorHandler);
            } else {
                bluetoothManager.stopDeviceScan();
            }
        });

        return () => {
            subscription.remove();
            bluetoothManager.stopDeviceScan();
        };
    }, []);

    return { startDeviceScan };
};
