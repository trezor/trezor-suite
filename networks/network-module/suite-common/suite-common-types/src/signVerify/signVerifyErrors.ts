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

type ConnectError = {
    message: string;
    code: string;
};

export const connectErrorToSignVerifyError = ({
    message,
    code,
}: ConnectError): DeviceCancelledErrType | DeviceErrorType =>
    isCanceledErrorMessage(message) ? DeviceCancelledErr() : { ...DeviceError(message), code };
