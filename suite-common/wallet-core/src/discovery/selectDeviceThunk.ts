import {
    DEVICE_MODULE_PREFIX,
    deviceActions,
    selectDevices,
    selectIsSameOrNewDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getSelectedDevice, sortByTimestamp } from '@suite-common/suite-utils';
import { type Device } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';

type SelectDeviceThunkParams = {
    device: Device | TrezorDevice | undefined;
};

/**
 * Called from:
 * - `@trezor/connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 */
export const selectDeviceThunk = createThunk<
    { device: TrezorDevice | undefined },
    SelectDeviceThunkParams,
    void
>(
    `${DEVICE_MODULE_PREFIX}/selectDevice`,
    ({ device }, { dispatch, getState, fulfillWithValue }) => {
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

        return fulfillWithValue({ device: trezorDevice });
    },
);

export const selectNewlyConnectedDeviceThunk = createThunk<void, SelectDeviceThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/selectNewlyConnectedDevice`,
    ({ device }, { dispatch, getState, rejectWithValue }) => {
        if (!isNative() && !selectIsSameOrNewDevice(getState(), device)) {
            // Select automatically when it is the first known device (none selected),
            // or when we connected physical device corresponding to a selected remembered wallet.
            return rejectWithValue('no-need-to-select');
        }

        dispatch(selectDeviceThunk({ device }));
    },
);
