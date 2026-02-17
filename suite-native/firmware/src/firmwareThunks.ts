import { createThunk } from '@suite-common/redux-utils';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';

const NATIVE_FIRMWARE_MODULE_PREFIX = 'nativeFirmware';

export const setTemporaryRememberedDeviceThunk = createThunk(
    `${NATIVE_FIRMWARE_MODULE_PREFIX}/setTemporaryRememberedDevice`,
    (
        { temporaryRemember }: { temporaryRemember: boolean },
        { getState, rejectWithValue, dispatch },
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device) {
            return rejectWithValue('Device not found');
        }

        dispatch(
            deviceActions.setTemporaryRememberedDevice({
                device,
                temporaryRemember,
            }),
        );

        // if the device is not connected and it was remembered only temporarily, we need to forget it
        if (!device.connected && device.temporaryRemember && !temporaryRemember) {
            dispatch(deviceActions.forgetDevice({ device }));
        }

        return;
    },
);
