import {
    DEVICE_MODULE_PREFIX,
    type DeviceRootState,
    type KeepSelectionReason,
    deviceActions,
    getShouldSelectConnectedDevice,
    selectDevices,
    selectPhysicalDeviceWallets,
    selectSelectedDevice,
} from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getSelectedDevice, sortByTimestamp } from '@suite-common/suite-utils';
import { type Device } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';

type SelectDeviceThunkParams = {
    device: Device | TrezorDevice | undefined;
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
    ({ device }, { dispatch, getState, fulfillWithValue }) => {
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

        dispatch(deviceActions.selectDevice(trezorDevice));

        return fulfillWithValue({ device: trezorDevice });
    },
);

type SelectNewlyConnectedDeviceThunkState = DeviceRootState & FirmwareRootState;

export const selectNewlyConnectedDeviceThunk = createThunk<
    void,
    SelectDeviceThunkParams,
    { state: SelectNewlyConnectedDeviceThunkState; rejectValue: KeepSelectionReason }
>(
    `${DEVICE_MODULE_PREFIX}/selectNewlyConnectedDevice`,
    ({ device }, { dispatch, getState, rejectWithValue }) => {
        // Mobile has a single device at a time, so it always follows the one that connected.
        if (isNative()) {
            dispatch(selectDeviceThunk({ device }));

            return;
        }

        const { shouldSelect, reason } = getShouldSelectConnectedDevice({
            incomingDevice: device,
            selectedDevice: selectSelectedDevice(getState()),
            physicalDeviceWallets: selectPhysicalDeviceWallets(getState()),
            firmware: selectFirmware(getState()),
        });

        if (!shouldSelect) {
            // Rejected with the reason, so that it is visible in the action and in the logs.
            return rejectWithValue(reason);
        }

        dispatch(selectDeviceThunk({ device }));
    },
);
