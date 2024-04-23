import { createThunk } from '@suite-common/redux-utils';
import {
    deviceActions,
    selectDevice,
    selectDeviceThunk,
    selectDevices,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

const PASSPHRASE_MODULE_PREFIX = '@suite-native/device';

export const cancelPassphraseAndSelectStandardDeviceThunk = createThunk(
    `${PASSPHRASE_MODULE_PREFIX}/cancelPassphraseFlow`,
    (_, { getState, dispatch }) => {
        const devices = selectDevices(getState());
        const device = selectDevice(getState());

        if (!device) return;

        // Select standard wallet (e.g. empty passphrase) that has the same device ID.
        const standardWalletDeviceIndex = devices.findIndex(
            d => d.id === device.id && d.instance === 1,
        );

        TrezorConnect.cancel();
        dispatch(selectDeviceThunk(devices[standardWalletDeviceIndex]));

        // Remove device on which the passphrase flow was canceled
        dispatch(deviceActions.forgetDevice(device));
    },
);
