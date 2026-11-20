import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
} from '@trezor/device';

export type SignedMessage = {
    signature: string;
    pubKey?: string;
};

export type SignError = DeviceCancelledErrType | DeviceErrorType | DeviceNotConnectedErrorType;

export type VerifyError = DeviceCancelledErrType | DeviceErrorType | DeviceNotConnectedErrorType;

export type SignVerifyError = SignError | VerifyError;
