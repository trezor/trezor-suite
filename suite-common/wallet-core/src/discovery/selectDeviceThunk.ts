import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { getSelectedDevice, sortByTimestamp } from '@suite-common/suite-utils';
import { Device } from '@trezor/connect';

import { DEVICE_MODULE_PREFIX, deviceActions } from '../device/deviceActions';
import { selectDevices } from '../device/deviceSelectors';

type SelectDeviceThunkParams = {
    device: Device | TrezorDevice | undefined;
};

/**
 * Called from:
 * - `@trezor/connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 */
export const selectDeviceThunk = createThunk<void, SelectDeviceThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/selectDevice`,
    ({ device }, { dispatch, getState, extra }) => {
        let trezorDevice: TrezorDevice | typeof undefined;
        const devices = selectDevices(getState());

        if (device) {
            // "ts" is one of the field which distinguish Device from TrezorDevice
            // (device from connect doesn't have timestamp but suite device has)
            if ('ts' in device) {
                // requested device is a @suite TrezorDevice type. get exact instance from reducer
                trezorDevice = getSelectedDevice(device, devices);
            } else {
                // requested device is a @trezor/connect Device type
                // find all instances and select recently used
                const instances = devices.filter(d => d.path === device.path);

                trezorDevice = sortByTimestamp(instances)[0];
            }
        }

        dispatch(deviceActions.selectDevice(trezorDevice));
        if (
            trezorDevice?.state?.staticSessionId !== undefined &&
            extra.selectors.selectSuiteSettings(getState()).isLocalFirstStorageEnabled
        ) {
            dispatch(extra.thunks.subscribeLocalFirstStorage({ device: trezorDevice }));
        }
    },
);
