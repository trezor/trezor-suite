import type { BluetoothIpcApi } from './types';

const noop = () => {
    throw new Error('bluetoothIpc.NOOP');
};

/*
 * wrap bluetoothIpc with ipcProxy in ./src/browser.ts
 * throws NOOP in nodejs (main) context
 */
export const bluetoothIpc: BluetoothIpcApi = {
    init: noop,
    dispose: noop,
    startScan: noop,
    stopScan: noop,
    connectDevice: noop,
    disconnectDevice: noop,
    forgetDevice: noop,
    on: noop,
    off: noop,
    removeAllListeners: noop,
};
