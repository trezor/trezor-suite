import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothStartScanDeps = {
    dispatch: Dispatch;
};

export type BluetoothStartScan = () => Promise<void>;

export const createBluetoothStartScan =
    (deps: BluetoothStartScanDeps): BluetoothStartScan =>
    async () => {
        // This can fail, but if there is an error, we already got it from `adapter-event`
        // and the user is informed about it (bluetooth turned-off, ...)
        const resp = await bluetoothIpc.startScan('ui');
        if (resp.success) {
            deps.dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));
        }
    };
