import { createThunk } from '@suite-common/redux-utils';
import {
    DEVICE_MODULE_PREFIX,
    selectDeviceThunk,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { selectRecentlyConnectedDevice } from 'src/selectors/suite/suiteSelectors';

import { setRecentlyConnectedDevicePath } from '../suite/suiteActions';

// duration to visually indicate the device as recently connected
const RECENTLY_CONNECTED_DEVICE_TIMEOUT = 5_000;

export const handleDeviceConnect = createThunk(
    `${DEVICE_MODULE_PREFIX}/handleDeviceConnect`,
    (device: Device, { dispatch, getState }) => {
        const selectedDevice = selectSelectedDevice(getState());

        // Select automatically when it is the first known device (none selected),
        // or when we connected physical device corresponding to a selected remembered wallet.
        const shouldSelectDevice = selectedDevice === undefined || device.id === selectedDevice.id;
        if (shouldSelectDevice) {
            dispatch(selectDeviceThunk({ device }));

            return;
        }

        // device.path preferred because we only care about current session (not persistent),
        // and the device may initially connect as unacquired before becoming acquired.
        dispatch(setRecentlyConnectedDevicePath(device.path ?? device.id ?? null));

        setTimeout(() => {
            // The device may have been disconnected, and another one connected in the meantime,
            // so ensure that timeout affects only that device for which it was scheduled.
            const deviceCurrent = selectRecentlyConnectedDevice(getState());
            const deviceWhenScheduled = device;
            if (
                deviceCurrent?.path === deviceWhenScheduled.path ||
                deviceCurrent?.id === deviceWhenScheduled.id
            ) {
                dispatch(setRecentlyConnectedDevicePath(null));
            }
        }, RECENTLY_CONNECTED_DEVICE_TIMEOUT);
    },
);
