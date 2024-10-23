import { useSyncExternalStore } from 'react';

import { BLEStatus, nativeBleManager } from '@trezor/transport-native-ble';

export const useBluetoothState = (): BLEStatus => {
    const bluetoothState = useSyncExternalStore<BLEStatus>(
        onStoreChange => {
            return nativeBleManager.onStatusChange(onStoreChange);
        },
        () => {
            return nativeBleManager.getStatus();
        },
    );

    return bluetoothState;
};
