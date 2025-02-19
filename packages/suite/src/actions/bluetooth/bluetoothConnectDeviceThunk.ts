import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type ThunkResponse = ReturnType<typeof bluetoothIpc.connectDevice>;

export const bluetoothConnectDeviceThunk = createThunk<ThunkResponse, { id: string }, void>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ id }, { fulfillWithValue }) => {
        const result = await bluetoothIpc.connectDevice(id);

        return fulfillWithValue(result);
    },
);
