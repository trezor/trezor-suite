import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

export const bluetoothStartScanningThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/bluetoothStartScanningThunk`,
    (_, { dispatch }) => {
        dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));
        // This can fail, but if there is an error, we already got it from `adapter-event`
        // and the user is informed about it (bluetooth turned-off, ...)
        bluetoothIpc.startScan();
    },
);
