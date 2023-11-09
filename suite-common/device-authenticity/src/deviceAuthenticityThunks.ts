import TrezorConnect, { AuthenticateDeviceResult } from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions, ToastPayload } from '@suite-common/toast-notifications';

import { ACTION_PREFIX, deviceAuthenticityActions } from './deviceAuthenticityActions';

export const checkDeviceAuthenticityThunk = createThunk<{
    allowDebugKeys: boolean;
    skipSuccessToast?: boolean;
}>(
    `${ACTION_PREFIX}/checkDeviceAuthenticity`,
    async ({ allowDebugKeys, skipSuccessToast }, { dispatch, getState, extra }) => {
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

        let storedResult:
            | AuthenticateDeviceResult
            | { error: string; valid?: boolean }
            | undefined = result.payload;
        let toastPayload: ToastPayload | undefined;

        if (!result.success) {
            toastPayload = {
                type: 'error',
                error: `Unable to validate device: ${result.payload.error}`,
            };
            storedResult = device.features?.bootloader_locked
                ? undefined
                : {
                      valid: false,
                      error: result.payload.error,
                  };
        } else if (result.payload.error === 'CA_PUBKEY_NOT_FOUND' && result.payload.configExpired) {
            // CA_PUBKEY_NOT_FOUND with configExpired is temporarily allowed and just logged to Sentry
            storedResult = {
                ...result.payload,
                valid: true,
            };
        } else if (!result.payload.valid) {
            toastPayload = {
                type: 'device-authenticity-error',
                error: `Device is not authentic: ${result.payload.error}`,
            };
        }

        if (!skipSuccessToast && storedResult?.valid) {
            toastPayload = { type: 'device-authenticity-success' };
        }

        if (toastPayload) {
            dispatch(notificationsActions.addToast(toastPayload));
        }

        dispatch(deviceAuthenticityActions.result({ device, result: storedResult }));
    },
);
