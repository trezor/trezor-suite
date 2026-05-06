import type {
    AuthenticateDeviceParams,
    VerifyAuthenticityProofResult,
} from '@trezor/device-authenticity';

import type { Params, Response } from '../params';

export type { AuthenticateDeviceParams };

export type AuthenticateDeviceResult = {
    // Signed by Optiga secure element, available in all Trezor Safe devices.
    optigaResult: VerifyAuthenticityProofResult;
    // Signed by Tropic secure element, only available in Trezor Safe 7 and above.
    tropicResult: VerifyAuthenticityProofResult | null;
    // Signed by a post-quantum algorithm by the MCU, only available in Trezor Safe 7 and above.
    // (microcontroller unit is present on all models, but only latest models have signing capability)
    mcuResult: VerifyAuthenticityProofResult | null;
};

export declare function authenticateDevice(
    params: Params<AuthenticateDeviceParams>,
): Response<AuthenticateDeviceResult>;
