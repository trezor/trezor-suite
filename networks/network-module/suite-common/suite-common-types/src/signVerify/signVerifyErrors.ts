import {
    DeviceCancelledErr,
    type DeviceCancelledErrType,
    DeviceError,
    type DeviceErrorType,
} from '@trezor/device';

export type SignVerifyNotSupportedErrorType = { type: 'SignVerifyNotSupported' };

export const SignVerifyNotSupportedError = (): SignVerifyNotSupportedErrorType => ({
    type: 'SignVerifyNotSupported',
});

// Matched by code, as Connect's cancel messages are 'Canceled' or a translated reason.
const CANCEL_ERROR_CODES = ['Method_Cancel', 'Failure_ActionCancelled'];

type ConnectError = {
    message: string;
    code: string;
};

export const connectErrorToSignVerifyError = ({
    message,
    code,
}: ConnectError): DeviceCancelledErrType | DeviceErrorType =>
    CANCEL_ERROR_CODES.includes(code) ? DeviceCancelledErr() : { ...DeviceError(message), code };
