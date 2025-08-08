import { createThunk } from '@suite-common/redux-utils';
import {
    DEVICE_MODULE_PREFIX,
    selectDeviceThunk,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { openSwitchDeviceDialog } from './addWalletThunk';

/**
 * Triggered by @trezor/connect events DEVICE.CONNECT or DEVICE.CONNECT_UNACQUIRED.
 * @param device physical device that was just now connected (raw Connect device, not yet enriched to TrezorDevice type)
 */
export const handleDeviceConnect = createThunk(
    `${DEVICE_MODULE_PREFIX}/handleDeviceConnect`,
    (device: Device, { dispatch, getState }) => {
        const selectedDevice = selectSelectedDevice(getState());

        const shouldSelectDevice =
            // Select automatically when it is the first encountered device,
            !selectedDevice ||
            // or when we connected physical device corresponding to a selected remembered wallet,
            device.id === selectedDevice.id ||
            // or when currently selected device is remembered, and a different device is physically connected.
            !selectedDevice.connected;

        if (shouldSelectDevice) {
            dispatch(selectDeviceThunk({ device }));
        } else {
            dispatch(openSwitchDeviceDialog());
        }
    },
);
