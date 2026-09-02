import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';

import { DEVICE_MODULE_PREFIX } from './deviceConstants';
import { type DeviceRootState } from './deviceReducer';
import { selectSelectedDevice } from './deviceSelectors';

/**
 * Called from <AcquireDevice /> component
 * Fetch device features without asking for pin/passphrase
 */
type AcquireDeviceThunkParams = {
    requestedDevice?: TrezorDevice | null;
};

type AcquireDeviceThunkState = DeviceRootState;

export const acquireDeviceThunk = createThunk<
    void,
    AcquireDeviceThunkParams,
    { state: AcquireDeviceThunkState }
>(
    `${DEVICE_MODULE_PREFIX}/acquireDeviceThunk`,
    async ({ requestedDevice }, { dispatch, getState, rejectWithValue }) => {
        const device = requestedDevice ?? selectSelectedDevice(getState());

        if (!device) {
            return rejectWithValue({ error: 'Device_NotFound' });
        }

        const response = await TrezorConnect.getFeatures({ device });

        if (!response.success) {
            if (response.error.code !== 'Device_ThpPairingTagInvalid') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'acquire-error',
                        device,
                        error: response.error.message,
                    }),
                );
            }

            return rejectWithValue({ error: response.error.message });
        }
    },
);
