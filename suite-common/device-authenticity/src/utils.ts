import { AuthenticateDeviceResult } from '@trezor/connect';

export const isDeviceAuthenticityValid = (result: AuthenticateDeviceResult) =>
    result.optigaResult.valid && result.tropicResult?.valid !== false;
