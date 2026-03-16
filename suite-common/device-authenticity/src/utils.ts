import { type AuthenticateDeviceResult } from '@trezor/connect';

type IsDeviceAuthenticityValidParams = {
    result: AuthenticateDeviceResult;
    isOptigaRemotelyDisabled: boolean;
    isTropicRemotelyDisabled: boolean;
};

export const isDeviceAuthenticityValid = ({
    result,
    isOptigaRemotelyDisabled,
    isTropicRemotelyDisabled,
}: IsDeviceAuthenticityValidParams) => {
    const isOptigaValid = result.optigaResult.valid === true || isOptigaRemotelyDisabled;
    // Note: Tropic will be undefined for T2B1, T3B1, T3T1, but Connect takes care that it will fail for models which are expected to have it (T3W1)
    const isTropicValid = result.tropicResult?.valid !== false || isTropicRemotelyDisabled;

    return isOptigaValid && isTropicValid;
};
