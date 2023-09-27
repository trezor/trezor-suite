import TrezorConnect from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { ACTION_PREFIX, deviceAuthenticityActions } from './deviceAuthenticityActions';

export const checkDeviceAuthenticityThunk = createThunk<{ allowDebugKeys: boolean }>(
    `${ACTION_PREFIX}/checkDeviceAuthenticity`,
    async ({ allowDebugKeys }, { dispatch, getState, extra, rejectWithValue }) => {
        const {
            selectors: { selectDevice },
        } = extra;
        const device = selectDevice(getState());
        if (!device) {
            throw new Error('device is not connected');
        }

        const result = await TrezorConnect.authenticateDevice({
            device: {
                path: device.path,
            },
            allowDebugKeys,
        });

        if (result.success) {
            if (result.payload.valid) {
                dispatch(notificationsActions.addToast({ type: 'device-authenticity-success' }));
            } else if (
                result.payload.configExpired &&
                result.payload.error === 'CA_PUBKEY_NOT_FOUND'
            ) {
                // sanity check result: CA_PUBKEY_NOT_FOUND with configExpired is temporary allowed
                // it will be logged to sentry nevertheless (see sentryMiddleware)
                // TODO: try fetch new config
                // if (result.payload.configOutdated) {}
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'device-authenticity-error',
                        error: `Device is not authentic: ${result.payload.error}`,
                    }),
                );
            }
            dispatch(deviceAuthenticityActions.result({ device, result: result.payload }));
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Unable to validate device: ${result.payload.error}`,
                }),
            );
            return rejectWithValue(result.payload.error);
        }
    },
);
