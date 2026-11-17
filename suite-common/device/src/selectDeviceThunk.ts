import { type TrezorDevice } from '@suite-common/suite-types';
import { getSelectedDevice, sortByTimestamp } from '@suite-common/suite-utils';
import { type Device } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';
import { createThunk } from '@trezor/redux-utils';

import { deviceActions } from './deviceActions';
import { DEVICE_MODULE_PREFIX } from './deviceConstants';
import { type DeviceRootState } from './deviceReducer';
import { selectDevices, selectIsSameOrNewDevice, selectSelectedDevice } from './deviceSelectors';

type SelectDeviceThunkParams = {
    device: Device | TrezorDevice | undefined;
    isNewlyConnected?: boolean;
};

type SelectDeviceThunkState = DeviceRootState;

/**
 * Called from:
 * - `@trezor/connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 */
export const selectDeviceThunk = createThunk<
    { device: TrezorDevice | undefined },
    SelectDeviceThunkParams,
    { state: SelectDeviceThunkState }
>(
    `${DEVICE_MODULE_PREFIX}/selectDevice`,
    ({ device, isNewlyConnected }, { dispatch, getState, fulfillWithValue }) => {
        let trezorDevice: TrezorDevice | undefined;
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

        dispatch(deviceActions.selectDevice(trezorDevice, { isNewlyConnected }));

        return fulfillWithValue({ device: trezorDevice });
    },
);

type SelectNewlyConnectedDeviceThunkState = DeviceRootState;

export const selectNewlyConnectedDeviceThunk = createThunk<
    void,
    SelectDeviceThunkParams,
    { state: SelectNewlyConnectedDeviceThunkState }
>(
    `${DEVICE_MODULE_PREFIX}/selectNewlyConnectedDevice`,
    ({ device }, { dispatch, getState, rejectWithValue }) => {
        // The reducer keeps the device that is already connected over another transport (USB) when
        // the same device also connects over Bluetooth, so no device has the Bluetooth path and
        // selecting by it would deselect the device.
        const devices = selectDevices(getState());
        const deviceConnectedOverOtherTransport =
            device?.descriptor.apiType === 'bluetooth' && device.id
                ? devices.find(
                      d =>
                          d.id === device.id && d.connected && d.descriptor.apiType !== 'bluetooth',
                  )
                : undefined;
        if (deviceConnectedOverOtherTransport) {
            const selectedDevice = selectSelectedDevice(getState());
            // Native selects the unacquired Bluetooth entry first; the reducer has now replaced it
            // with the kept device, so select that instead of keeping a selection that no longer exists.
            if (selectedDevice && !getSelectedDevice(selectedDevice, devices)) {
                dispatch(
                    selectDeviceThunk({
                        device: deviceConnectedOverOtherTransport,
                        isNewlyConnected: true,
                    }),
                );

                return;
            }

            return rejectWithValue('already-connected-over-other-transport');
        }

        if (!isNative() && !selectIsSameOrNewDevice(getState(), device)) {
            // Select automatically when it is the first known device (none selected),
            // or when we connected physical device corresponding to a selected remembered wallet.
            return rejectWithValue('no-need-to-select');
        }

        dispatch(selectDeviceThunk({ device, isNewlyConnected: true }));
    },
);
