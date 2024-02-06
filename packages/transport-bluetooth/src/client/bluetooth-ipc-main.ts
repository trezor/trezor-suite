import { TypedEmitter } from '@trezor/utils';

import type { BluetoothIpcApi, BluetoothIpcEvents, BluetoothIpcState } from './types';

const noop = (..._args: any[]) =>
    Promise.resolve({ success: false, error: 'BluetoothIpc.NOOP' } as const);

/*
 * used in @trezor/suite-desktop-core nodejs (main) context
 * unavailable in browser (renderer) context
 */
export class BluetoothIpc extends TypedEmitter<BluetoothIpcEvents> implements BluetoothIpcApi {
    init(state?: BluetoothIpcState) {
        return Promise.resolve({ success: true, payload: state } as const);
    }

    dispose() {
        return noop();
    }

    startScan() {
        return noop();
    }

    stopScan() {
        return noop();
    }

    connectDevice(id: string) {
        return noop(id);
    }

    disconnectDevice(id: string) {
        return noop(id);
    }

    forgetDevice(id: string) {
        return noop(id);
    }
}
