import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import type { TrezorDevice } from '@suite-common/suite-types';
import { handleDeviceDisconnect } from '@suite-common/wallet-core';
import type { Device } from '@trezor/connect';

const DEVICE_MODULE_PREFIX = '@suite';

export const disconnectDeviceThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/handleDeviceDisconnect`,
    (device: Device | TrezorDevice, { dispatch, getState }) => {
        const selectedDevice = selectSelectedDevice(getState());
        if (!selectedDevice) return;
        if (selectedDevice.path !== device.path) return;

        dispatch(handleDeviceDisconnect(device));
    },
);
