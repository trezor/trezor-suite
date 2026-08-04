import { selectIsDeviceLocked } from '@suite/locks';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import type { TrezorDevice } from '@suite-common/suite-types';
import { handleDeviceDisconnect } from '@suite-common/wallet-core';
import type { Device } from '@trezor/connect';
import TrezorConnect from '@trezor/connect';

const DEVICE_MODULE_PREFIX = '@suite';

type DisconnectDeviceThunkState = DeviceRootState;

export const disconnectDeviceThunk = createThunk<
    void,
    Device | TrezorDevice,
    { state: DisconnectDeviceThunkState }
>(`${DEVICE_MODULE_PREFIX}/handleDeviceDisconnect`, (device, { dispatch, getState }) => {
    const selectedDevice = selectSelectedDevice(getState());
    if (!selectedDevice) return;
    if (selectedDevice.path !== device.path) return;

    dispatch(handleDeviceDisconnect(device));
});

/**
 * Connect call to rerun FW authenticity checks (getFeatures used as the most basic no-op device call).
 */
export const rerunFwAuthenticityChecksThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/rerunFwAuthenticityChecksThunk`,
    (_, { getState }) => {
        const device = selectSelectedDevice(getState());
        if (device === undefined) return;
        if (selectIsDeviceLocked(getState())) return;
        void TrezorConnect.getFeatures({ device: { path: device.path } });
    },
);
