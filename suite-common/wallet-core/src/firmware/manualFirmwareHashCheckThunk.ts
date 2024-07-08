import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { FIRMWARE_MODULE_PREFIX } from './firmwareActions';
import { validateFirmwareHashThunk } from './checkFirmwareHashThunk';

export const manualFirmwareHashCheckThunk = createThunk<
    void,
    void,
    { rejectValue: { error: string } }
>(
    `${FIRMWARE_MODULE_PREFIX}/checkFirmwareAuthenticity`,
    async (_, { dispatch, getState, extra, rejectWithValue }) => {
        const {
            selectors: { selectDevice },
        } = extra;

        const device = selectDevice(getState());
        if (!device) {
            return rejectWithValue({ error: 'device is not connected' });
        }

        const result = await dispatch(validateFirmwareHashThunk({ device }));

        if (result.payload === undefined || result.payload.success === 'unable-to-verify') {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Unable to validate firmware: ${result.payload !== undefined ? result.payload.error : ''}`,
                }),
            );
        } else if (result.payload.success === 'invalid') {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Firmware is not authentic!!!',
                }),
            );
        } else {
            dispatch(
                notificationsActions.addToast({ type: 'firmware-check-authenticity-success' }),
            );
        }
    },
);
