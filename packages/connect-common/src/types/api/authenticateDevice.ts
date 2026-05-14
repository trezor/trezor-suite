import type { VerifyAuthenticityProofResult } from '@trezor/device-authenticity';
import {
    DeviceAuthenticityBlacklistConfig,
    DeviceAuthenticityConfig,
} from '@trezor/device-authenticity';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type AuthenticateDeviceParams = Static<typeof AuthenticateDeviceParams>;
export const AuthenticateDeviceParams = Type.Object({
    config: Type.Optional(DeviceAuthenticityConfig),
    blacklistConfig: Type.Optional(DeviceAuthenticityBlacklistConfig),
    allowDebugKeys: Type.Optional(Type.Boolean()),
});

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
