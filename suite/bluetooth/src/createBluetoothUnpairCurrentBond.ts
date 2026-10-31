import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

type BluetoothUnpairCurrentBondDeps = {
    getSelectedDevice: () => TrezorDevice | undefined;
};

export type BluetoothUnpairCurrentBond = () => Promise<
    { success: true } | { success: false; error?: string }
>;

/**
 * Sends bleUnpair command to the Trezor device and cleans up BT state on success.
 * Does NOT trigger the global OS removal modal or bluetooth.forgetDevice.
 * Returns whether the unpair was successful.
 */
export const createBluetoothUnpairCurrentBond =
    (deps: BluetoothUnpairCurrentBondDeps): BluetoothUnpairCurrentBond =>
    async () => {
        const device = deps.getSelectedDevice();
        if (!device) {
            return { success: false };
        }

        const result = await TrezorConnect.bleUnpair({
            device: {
                path: device.path,
                // bleUnpair does not need state
            },
            all: false,
        });

        // bleUnpair may fail when the device disconnects mid-call.
        // The unpair has already happened on the device side,
        // so we proceed to OS removal regardless.
        if (
            result.success ||
            result.error.code === 'Device_Disconnected' // This is an expected success
        ) {
            return { success: true };
        }

        return { success: false, error: result.error.message };
    };
