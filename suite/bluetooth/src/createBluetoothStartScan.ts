import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { type BluetoothIpcApi, type IpcResponse } from '@trezor/transport-bluetooth';

export type BluetoothStartScanDeps = {
    dispatch: Dispatch;
    bluetoothIpc: Pick<BluetoothIpcApi, 'startScan'>;
};

export type BluetoothStartScan = () => Promise<IpcResponse>;

export const createBluetoothStartScan =
    (deps: BluetoothStartScanDeps): BluetoothStartScan =>
    () => {
        deps.dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));

        // This can fail, but if there is an error, we already got it from `adapter-event`
        // and the user is informed about it (bluetooth turned-off, ...)
        return deps.bluetoothIpc.startScan('ui');
    };
