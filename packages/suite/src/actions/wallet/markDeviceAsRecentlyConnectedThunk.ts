import { createThunk } from '@suite-common/redux-utils';
import { DEVICE_MODULE_PREFIX } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { selectRecentlyConnectedDevice } from 'src/selectors/suite/suiteSelectors';

import { setRecentlyConnectedDevicePath } from '../suite/suiteActions';

// duration to visually indicate the device as recently connected
const RECENTLY_CONNECTED_DEVICE_TIMEOUT = 5_000;

export const markDeviceAsRecentlyConnectedThunk = createThunk<void, Device, void>(
    `${DEVICE_MODULE_PREFIX}/handleDeviceConnect`,
    (device, { dispatch, getState }) => {
        // Set the Device as recently connected to show a notification in the UI, and schedule disappearance.
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
