import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    type Address,
    type CardanoAddress,
    type Response as ConnectResponse,
} from '@trezor/connect';

const ADDRESS_VERIFICATION_ACTION_CANCELLED_ERROR_CODE = 'Failure_ActionCancelled';

const ADDRESS_VERIFICATION_ERROR_CODES_WITHOUT_ALERT = [
    'Method_Interrupted',
    'Failure_PinInvalid',
    'Method_Cancel',
    'Failure_PinCancelled',
] as const;

const INCORRECT_PASSPHRASE_ERROR_MESSAGE = 'Passphrase is incorrect';

type AddressVerificationError = {
    code?: string;
    message: string;
};

export enum AddressVerificationResultType {
    Success = 'success',
    DeviceAccessError = 'device-access-error',
    ActionCancelled = 'action-cancelled',
    PassphraseIncorrect = 'passphrase-incorrect',
    Silent = 'silent',
    Unexpected = 'unexpected',
}

type AddressVerificationErrorResultType =
    | AddressVerificationResultType.ActionCancelled
    | AddressVerificationResultType.PassphraseIncorrect
    | AddressVerificationResultType.Silent
    | AddressVerificationResultType.Unexpected;

type AddressVerificationConnectResponse = Awaited<ConnectResponse<Address | CardanoAddress>>;
type AddressVerificationConnectError = Extract<
    AddressVerificationConnectResponse,
    { success: false }
>['error'];

type ConfirmAddressOnDevice = () => Promise<ConnectResponse<Address | CardanoAddress>>;

export type AddressVerificationResult =
    | { type: AddressVerificationResultType.Success }
    | { type: AddressVerificationResultType.DeviceAccessError; error: string }
    | { type: AddressVerificationErrorResultType; error: AddressVerificationConnectError };

const getAddressVerificationErrorResultType = ({
    code,
    message,
}: AddressVerificationError): AddressVerificationErrorResultType => {
    if (code === ADDRESS_VERIFICATION_ACTION_CANCELLED_ERROR_CODE) {
        return AddressVerificationResultType.ActionCancelled;
    }

    if (message === INCORRECT_PASSPHRASE_ERROR_MESSAGE) {
        return AddressVerificationResultType.PassphraseIncorrect;
    }

    if (ADDRESS_VERIFICATION_ERROR_CODES_WITHOUT_ALERT.some(errorCode => errorCode === code)) {
        return AddressVerificationResultType.Silent;
    }

    return AddressVerificationResultType.Unexpected;
};

export const verifyReceiveAddress = async (
    confirmAddressOnDevice: ConfirmAddressOnDevice,
): Promise<AddressVerificationResult> => {
    const response = await requestPrioritizedDeviceAccess(confirmAddressOnDevice);

    if (!response.success) {
        return {
            type: AddressVerificationResultType.DeviceAccessError,
            error: response.error,
        };
    }

    if (response.payload.success) {
        return { type: AddressVerificationResultType.Success };
    }

    return {
        type: getAddressVerificationErrorResultType(response.payload.error),
        error: response.payload.error,
    };
};
