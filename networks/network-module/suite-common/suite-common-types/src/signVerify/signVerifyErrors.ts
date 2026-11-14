import {
    DeviceCancelledErr,
    type DeviceCancelledErrType,
    DeviceError,
    type DeviceErrorType,
    isCanceledErrorMessage,
} from '@trezor/device';

export type SignVerifyNotSupportedErrorType = { type: 'SignVerifyNotSupported' };

export const SignVerifyNotSupportedError = (): SignVerifyNotSupportedErrorType => ({
    type: 'SignVerifyNotSupported',
});

export const connectErrorToSignVerifyError = ({
    message,
    code,
}: {
    message: string;
    code: string;
}): DeviceCancelledErrType | DeviceErrorType =>
    isCanceledErrorMessage(message) ? DeviceCancelledErr() : { ...DeviceError(message), code };
