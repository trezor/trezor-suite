import { createIpcProxy } from '@trezor/ipc-proxy';

import type { BluetoothIpcApi } from './client/types';
import { bluetoothManager } from './client/bluetooth-ipc-proxy';

// **browser context**
// file exported as index of `@trezor/transport-bluetooth`
// create ipcProxy and wrap each method of bluetoothManager

const proxyState = () => {
    let proxyPromise: Promise<BluetoothIpcApi> | undefined;

    return () => {
        if (proxyPromise) return proxyPromise;

        proxyPromise = createIpcProxy<BluetoothIpcApi>('Bluetooth');

        return proxyPromise;
    };
};

const getProxy = proxyState();
(Object.keys(bluetoothManager) as (keyof BluetoothIpcApi)[]).forEach(key => {
    (bluetoothManager[key] as unknown) = (...args: any[]) =>
        getProxy().then(p => (p[key] as any)(...args));
});

export { bluetoothManager };
