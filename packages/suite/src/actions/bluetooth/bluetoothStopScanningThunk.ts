import {
    type DesktopDeviceRootState,
    selectDeviceDefaultConnectionMode,
    selectIsConnectionModalOpen,
} from '@suite/device';
import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothStopScanningThunkState = DesktopDeviceRootState;

export const bluetoothStopScanningThunk = createThunk<
    void,
    void,
    { state: BluetoothStopScanningThunkState }
>(`${BLUETOOTH_PREFIX}/bluetoothStopScanningThunk`, (_, { dispatch, getState }) => {
    const defaultConnectionMode = selectDeviceDefaultConnectionMode(getState());
    const isModalOpen = selectIsConnectionModalOpen(getState());
    if (defaultConnectionMode === 'bluetooth' && isModalOpen) {
        // Don't actually stop scanning
        return;
    }

    dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
    // This can fail, but there is nothing we can do about it
    console.log('_____BT: scanning - STOP');
    bluetoothIpc.stopScan();
});
