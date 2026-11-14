import {
    DeviceCancelledErr,
    type DeviceCancelledErrType,
    DeviceError,
    type DeviceErrorType,
    isCanceledErrorMessage,
} from '@trezor/device';

/** The account's network cannot sign, or cannot verify, messages. */
export type SignVerifyNotSupportedErrorType = { type: 'SignVerifyNotSupported' };

export const SignVerifyNotSupportedError = (): SignVerifyNotSupportedErrorType => ({
    type: 'SignVerifyNotSupported',
});

/**
 * Converts a Connect error the way Suite Sync does: a cancelled request is told by its message.
 * The device error keeps the Connect code for analytics.
 */
export const toSignVerifyDeviceError = ({
    message,
    code,
}: {
    message: string;
    code: string;
}): DeviceCancelledErrType | DeviceErrorType =>
    isCanceledErrorMessage(message) ? DeviceCancelledErr() : { ...DeviceError(message), code };
