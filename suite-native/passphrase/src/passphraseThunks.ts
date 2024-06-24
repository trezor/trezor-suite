import { createThunk } from '@suite-common/redux-utils';
import {
    authorizeDeviceThunk,
    deviceActions,
    selectDevice,
    selectDeviceThunk,
    selectDevices,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

const PASSPHRASE_MODULE_PREFIX = '@suite-native/device';

export const cancelPassphraseAndSelectStandardDeviceThunk = createThunk(
    `${PASSPHRASE_MODULE_PREFIX}/cancelPassphraseFlow`,
    (_, { getState, dispatch, extra }) => {
        const devices = selectDevices(getState());
        const device = selectDevice(getState());

        if (!device) return;

        // Select standard wallet (e.g. empty passphrase) that has the same device ID.
        const standardWalletDeviceIndex = devices.findIndex(
            d => d.id === device.id && d.instance === 1,
        );

        TrezorConnect.cancel();
        dispatch(selectDeviceThunk({ device: devices[standardWalletDeviceIndex] }));

        const settings = extra.selectors.selectSuiteSettings(getState());

        // Remove device on which the passphrase flow was canceled
        dispatch(deviceActions.forgetDevice({ device, settings }));
    },
);

export const verifyPassphraseOnEmptyWalletThunk = createThunk(
    `${PASSPHRASE_MODULE_PREFIX}/verifyPassphraseOnEmptyWallet`,
    async (_, { getState, rejectWithValue, fulfillWithValue }) => {
        const device = selectDevice(getState());

        if (!device) return;

        const response = await TrezorConnect.getDeviceState({
            device: {
                path: device.path,
                instance: device.instance,
                // Even though we have device state available, we intentionally send undefined so that connect requests passphrase
                // When we submit passphrase, we can then compare both device states (previous and current - they're derived from passphrase)
                // to see if they match.
                state: undefined,
            },
            keepSession: false,
        });

        if (response.success && response.payload.state !== device.state) {
            return rejectWithValue(false);
        }

        return fulfillWithValue(true);
    },
);

export const retryPassphraseAuthenticationThunk = createThunk(
    `${PASSPHRASE_MODULE_PREFIX}/retryPassphraseAuthentication`,
    (_, { dispatch, getState }) => {
        const device = selectDevice(getState());

        if (!device) return;
        dispatch(deviceActions.removeButtonRequests({ device }));
        dispatch(authorizeDeviceThunk({ shouldIgnoreDeviceState: true }));
    },
);
