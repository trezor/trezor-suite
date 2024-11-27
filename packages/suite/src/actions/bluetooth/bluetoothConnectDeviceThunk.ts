import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { BLUETOOTH_PREFIX } from './bluetoothActions';

type ThunkResponse = ReturnType<typeof bluetoothIpc.connectDevice>;

export const bluetoothConnectDeviceThunk = createThunk<ThunkResponse, { uuid: string }, void>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ uuid }, { fulfillWithValue }) => {
        const result = await bluetoothIpc.connectDevice(uuid);

        return fulfillWithValue(result);
    },
);
