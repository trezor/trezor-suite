import { createIpcProxy } from '@trezor/ipc-proxy';

import { bluetoothIpc } from './client/bluetooth-ipc-renderer';
import { BluetoothIpcApi } from './client/types';

/*
 * index in browser context (electron renderer)
 */
const proxyState = () => {
    let proxyPromise: Promise<BluetoothIpcApi> | undefined;

    return () => {
        if (proxyPromise) return proxyPromise;

        proxyPromise = createIpcProxy<BluetoothIpcApi>('Bluetooth');

        return proxyPromise;
    };
};

// create ipcProxy and wrap each bluetoothIpc method
const getProxy = proxyState();
(Object.keys(bluetoothIpc) as (keyof BluetoothIpcApi)[]).forEach(key => {
    (bluetoothIpc[key] as unknown) = (...args: any[]) =>
        getProxy().then(p => (p[key] as any)(...args));
});

// export modified bluetoothIpc
export { bluetoothIpc };
