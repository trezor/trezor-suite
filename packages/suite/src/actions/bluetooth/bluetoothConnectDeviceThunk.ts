import { createThunk } from '@suite-common/redux-utils';
import { bluetoothManager } from '@trezor/transport-bluetooth';

import { BLUETOOTH_PREFIX } from './bluetoothActions';

type ThunkResponse = ReturnType<typeof bluetoothManager.connectDevice>;

export const bluetoothConnectDeviceThunk = createThunk<ThunkResponse, { uuid: string }, void>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ uuid }, { fulfillWithValue }) => {
        const result = await bluetoothManager.connectDevice(uuid);

        return fulfillWithValue(result);
    },
);
