import { type AuthenticateDeviceResult } from '@trezor/connect';

type IsDeviceAuthenticityValidParams = {
    result: AuthenticateDeviceResult;
    isOptigaRemotelyDisabled: boolean;
    isTropicRemotelyDisabled: boolean;
    isMLDSA44RemotelyDisabled: boolean;
};

export const isDeviceAuthenticityValid = ({
    result,
    isOptigaRemotelyDisabled,
    isTropicRemotelyDisabled,
    isMLDSA44RemotelyDisabled,
}: IsDeviceAuthenticityValidParams) => {
    const isOptigaValid = result.optigaResult.valid === true || isOptigaRemotelyDisabled;
    // Note: Tropic and ML-DSA-44 are expected to be undefined for T2B1, T3B1, T3T1, but Connect will make it fail
    // for models which are expected to have it (all T3W1 versions for Tropic, TODO T3W1 >= 2.xx.x for ML-DSA-44)
    const isTropicValid = result.tropicResult?.valid !== false || isTropicRemotelyDisabled;
    const isMLDSA44Valid = result.MLDSA44Result?.valid !== false || isMLDSA44RemotelyDisabled;

    return isOptigaValid && isTropicValid && isMLDSA44Valid;
};
