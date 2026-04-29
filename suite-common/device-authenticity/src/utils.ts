import { type AuthenticateDeviceResult } from '@trezor/connect';

type IsDeviceAuthenticityValidParams = {
    result: AuthenticateDeviceResult;
    isOptigaRemotelyDisabled: boolean;
    isTropicRemotelyDisabled: boolean;
    isMCURemotelyDisabled: boolean;
};

export const isDeviceAuthenticityValid = ({
    result,
    isOptigaRemotelyDisabled,
    isTropicRemotelyDisabled,
    isMCURemotelyDisabled,
}: IsDeviceAuthenticityValidParams) => {
    const isOptigaValid = result.optigaResult.valid === true || isOptigaRemotelyDisabled;
    // Note: Tropic and MCU are expected to be undefined for T2B1, T3B1, T3T1, but Connect will make it fail
    // for models which are expected to have it (all T3W1 versions for Tropic, T3W1 >= 2.11.2 for MCU)
    const isTropicValid = result.tropicResult?.valid !== false || isTropicRemotelyDisabled;
    const isMCUValid = result.mcuResult?.valid !== false || isMCURemotelyDisabled;

    return isOptigaValid && isTropicValid && isMCUValid;
};
