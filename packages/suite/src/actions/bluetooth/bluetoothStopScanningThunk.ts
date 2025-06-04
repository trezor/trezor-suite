import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

export const bluetoothStopScanningThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/bluetoothStopScanningThunk`,
    (_, { dispatch }) => {
        dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        // This can fail, but there is nothing we can do about it
        bluetoothIpc.stopScan();
    },
);
