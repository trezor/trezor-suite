import { createThunk } from '@suite-common/redux-utils';
import {
    deviceActions,
    selectDeviceThunk,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

const PASSPHRASE_MODULE_PREFIX = '@suite-native/device';

export const cancelPassphraseAndSelectStandardDeviceThunk = createThunk(
    `${PASSPHRASE_MODULE_PREFIX}/cancelPassphraseFlow`,
    (_, { getState, dispatch, extra }) => {
        const devices = selectDevices(getState());
        const device = selectSelectedDevice(getState());

        if (!device) return;

        // Select standard wallet (e.g. empty passphrase) that has the same device ID.
        const standardWalletDeviceIndex = devices.findIndex(
            d => d.id === device.id && d.instance === 1,
        );

        TrezorConnect.cancel();

        if (device === devices[standardWalletDeviceIndex]) return;

        dispatch(selectDeviceThunk({ device: devices[standardWalletDeviceIndex] }));

        const settings = extra.selectors.selectSuiteSettings(getState());

        // Remove device on which the passphrase flow was canceled
        dispatch(deviceActions.forgetDevice({ device, settings }));
    },
);
