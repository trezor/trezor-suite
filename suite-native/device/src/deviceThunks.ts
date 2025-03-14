import { createThunk } from '@suite-common/redux-utils';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';

const NATIVE_DEVICE_MODULE_PREFIX = 'nativeDevice';

export const setTemporaryRememberedDeviceThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/setTemporaryRememberedDevice`,
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

        return;
    },
);
