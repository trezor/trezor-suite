import { createThunk } from '@suite-common/redux-utils';
import {
    DEVICE_MODULE_PREFIX,
    selectDeviceThunk,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { openSwitchDeviceDialog } from './addWalletThunk';

export const handleDeviceConnect = createThunk(
    `${DEVICE_MODULE_PREFIX}/handleDeviceConnect`,
    (device: Device, { dispatch, getState }) => {
        const selectedDevice = selectSelectedDevice(getState());

        // Select automatically when it is the first known device,
        // or when we connected physical device corresponding to a selected remembered wallet.
        const shouldSelectDevice = !selectedDevice || device.id === selectedDevice.id;
        if (shouldSelectDevice) {
            dispatch(selectDeviceThunk({ device }));
        } else {
            dispatch(openSwitchDeviceDialog());
        }
    },
);
