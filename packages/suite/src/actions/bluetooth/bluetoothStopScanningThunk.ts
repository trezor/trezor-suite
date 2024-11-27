import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { BLUETOOTH_PREFIX } from './bluetoothActions';

export const bluetoothStopScanningThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/bluetoothStopScanningThunk`,
    _ => {
        // This can fail, but there is nothing we can do about it
        bluetoothIpc.stopScan();
    },
);
