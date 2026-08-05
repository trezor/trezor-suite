import { type RouterRootState, selectRouterApp } from '@suite/router';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import type { TrezorDevice } from '@suite-common/suite-types';
import { handleDeviceDisconnect, selectDeviceThunk } from '@suite-common/wallet-core';
import type { Device } from '@trezor/connect';

const DEVICE_MODULE_PREFIX = '@suite';

type DisconnectDeviceThunkState = DeviceRootState & RouterRootState;

export const disconnectDeviceThunk = createThunk<
    void,
    Device | TrezorDevice,
    { state: DisconnectDeviceThunkState }
>(`${DEVICE_MODULE_PREFIX}/handleDeviceDisconnect`, (device, { dispatch, getState }) => {
    const selectedDevice = selectSelectedDevice(getState());
    if (!selectedDevice) return;
    if (selectedDevice.path !== device.path) return;

    const routerApp = selectRouterApp(getState());

    /**
     * Under normal circumstances, after device is disconnected we want suite to select another existing device (either remembered or physically connected)
     * This is not the case in firmware update and onboarding; In this case we simply wan't suite.device to be empty until user reconnects a device again
     */
    if (['onboarding', 'firmware', 'firmware-type'].includes(routerApp)) {
        dispatch(selectDeviceThunk({ device: undefined }));

        return;
    }

    dispatch(handleDeviceDisconnect(device));
});
