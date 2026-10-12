import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import {
    type DesktopDeviceRootState,
    selectDeviceDefaultConnectionMode,
    selectIsConnectionModalOpen,
} from '@suite/device';
import { bluetoothActions } from '@suite-common/bluetooth';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothScanRootState = DesktopDeviceRootState;

type BluetoothScanThunkDispatch = ThunkDispatch<BluetoothScanRootState, unknown, UnknownAction>;

type BluetoothScanDeps = {
    getState: () => BluetoothScanRootState;
    dispatch: BluetoothScanThunkDispatch;
};

export type BluetoothScan = {
    start: () => void;
    stop: () => void;
    setStatus: (status: 'idle' | 'running') => void;
};

export const createBluetoothScan = (deps: BluetoothScanDeps): BluetoothScan => ({
    start: () => {
        deps.dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));
        // Adapter events already inform the user about scan failures.
        bluetoothIpc.startScan('ui');
    },
    stop: () => {
        const defaultConnectionMode = selectDeviceDefaultConnectionMode(deps.getState());
        const isModalOpen = selectIsConnectionModalOpen(deps.getState());
        if (defaultConnectionMode === 'bluetooth' && isModalOpen) {
            return;
        }

        deps.dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        // Stopping can fail, but there is nothing we can do about it.
        bluetoothIpc.stopScan('ui');
    },
    setStatus: (status: 'idle' | 'running') => {
        deps.dispatch(bluetoothActions.scanStatusAction({ status }));
    },
});
