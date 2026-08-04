import { createIpcProxy } from '@trezor/ipc-proxy';
import { typedObjectKeys } from '@trezor/utils';

import { bluetoothIpc } from './client/bluetooth-ipc-renderer';
import { type BluetoothIpcApi } from './client/types';

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
typedObjectKeys(bluetoothIpc).forEach(key => {
    (bluetoothIpc[key] as unknown) = (...args: unknown[]) =>
        getProxy().then(p => (p[key] as (...args: unknown[]) => unknown)(...args));
});

// export modified bluetoothIpc
export { bluetoothIpc };
