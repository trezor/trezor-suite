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
    optigaResult: VerifyAuthenticityProofResult;
    tropicResult: VerifyAuthenticityProofResult | null;
};

export declare function authenticateDevice(
    params: Params<AuthenticateDeviceParams>,
): Response<AuthenticateDeviceResult>;
