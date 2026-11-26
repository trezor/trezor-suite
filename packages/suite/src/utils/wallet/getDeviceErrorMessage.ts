import { WALLET_MISMATCH_ERROR_CODE } from '@suite/device';
import { ERRORS } from '@trezor/connect-common';

const DEVICE_DISCONNECTED_DURING_ACTION = 'device disconnected during action';

type DeviceError = {
    code: unknown;
    message: string;
};

// Returns the message for a signing error toast, or undefined when the device is not the cause.
export const getDeviceErrorMessage = ({ code, message }: DeviceError) => {
    if (
        code === 'Device_InvalidState' || // incorrect passphrase submitted
        code === 'Method_Interrupted' // passphrase modal closed
    ) {
        return ERRORS.ERROR_CODES.Device_InvalidState;
    }

    if (code === 'Device_Disconnected' || message.includes(DEVICE_DISCONNECTED_DURING_ACTION)) {
        return ERRORS.ERROR_CODES.Device_Disconnected;
    }

    if (code === WALLET_MISMATCH_ERROR_CODE) {
        return WALLET_MISMATCH_ERROR_CODE;
    }

    return undefined;
};
