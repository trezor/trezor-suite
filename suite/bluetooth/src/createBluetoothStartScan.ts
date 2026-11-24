import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { type IpcResponse, bluetoothIpc } from '@trezor/transport-bluetooth';

export type BluetoothStartScanDeps = {
    dispatch: Dispatch;
};

export type BluetoothStartScan = () => Promise<IpcResponse>;

export const createBluetoothStartScan =
    (deps: BluetoothStartScanDeps): BluetoothStartScan =>
    () => {
        deps.dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));

        // This can fail, but if there is an error, we already got it from `adapter-event`
        // and the user is informed about it (bluetooth turned-off, ...)
        return bluetoothIpc.startScan('ui');
    };
