import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

export const bluetoothDisposeThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/bluetoothDisposeThunk`,
    async () => {
        bluetoothIpc.removeAllListeners();
        await bluetoothIpc.dispose();
    },
);
