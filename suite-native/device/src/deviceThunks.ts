import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { createThunk } from '@suite-common/redux-utils';

const NATIVE_DEVICE_MODULE_PREFIX = 'nativeDevice';

export const setDeviceForceRememberedThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/setDeviceForceRemembered`,
    ({ remember }: { remember: boolean }, { getState, rejectWithValue, dispatch }) => {
        const device = selectSelectedDevice(getState());
        if (!device) {
            return rejectWithValue('Device not found');
        }
        if (device.remember) {
            return rejectWithValue('Device is already remembered');
        }

        dispatch(
            deviceActions.rememberDevice({
                device,
                remember,
                forceRemember: remember ? true : undefined,
            }),
        );

        return;
    },
);
