import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

const USER_CANCELLED_ERROR_CODES = [
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
    'Method_Cancel',
    'Method_Interrupted', // passphrase prompt closed
];

const MISSING_SESSION_MESSAGE = 'Device session is not available';

export type DeviceSessionVerification =
    | { status: 'verified' }
    | { status: 'cancelled' }
    | { status: 'failed'; code: string | undefined; message: string };

export const verifyDeviceSession = async (
    device: TrezorDevice | undefined,
): Promise<DeviceSessionVerification> => {
    if (!device?.state?.staticSessionId) {
        return { status: 'failed', code: undefined, message: MISSING_SESSION_MESSAGE };
    }

    const response = await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
    });

    if (response.success) {
        return { status: 'verified' };
    }

    const { code, message } = response.error;

    if (USER_CANCELLED_ERROR_CODES.some(cancelledCode => cancelledCode === code)) {
        return { status: 'cancelled' };
    }

    return { status: 'failed', code, message };
};
