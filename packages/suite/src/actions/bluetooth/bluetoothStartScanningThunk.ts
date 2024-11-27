import { createThunk } from '@suite-common/redux-utils';
import { bluetoothManager } from '@trezor/transport-bluetooth';

import { BLUETOOTH_PREFIX } from './bluetoothActions';

export const bluetoothStartScanningThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/bluetoothStartScanningThunk`,
    _ => {
        // This can fail, but if there is an error we already got it from `adapter-event`
        // and user is informed about it (bluetooth turned-off, ...)
        bluetoothManager.startScan();
    },
);
