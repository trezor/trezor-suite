import { type Dispatch } from '@reduxjs/toolkit';

import { type ConnectionMode } from '@suite/device';
import { bluetoothActions } from '@suite-common/bluetooth';
import { type BluetoothIpcApi } from '@trezor/transport-bluetooth';

export type BluetoothStopScanDeps = {
    dispatch: Dispatch;
    bluetoothIpc: Pick<BluetoothIpcApi, 'stopScan'>;
    getDefaultConnectionMode: () => ConnectionMode;
    getIsConnectionModalOpen: () => boolean;
};

export type BluetoothStopScan = () => Promise<void>;

export const createBluetoothStopScan =
    (deps: BluetoothStopScanDeps): BluetoothStopScan =>
    async () => {
        const defaultConnectionMode = deps.getDefaultConnectionMode();
        const isModalOpen = deps.getIsConnectionModalOpen();
        if (defaultConnectionMode === 'bluetooth' && isModalOpen) {
            // Don't actually stop scanning
            return;
        }

        deps.dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        // This can fail, but there is nothing we can do about it.
        await deps.bluetoothIpc.stopScan('ui');
    };
