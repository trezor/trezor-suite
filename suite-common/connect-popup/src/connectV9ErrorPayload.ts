import { ERROR_CODES } from '@trezor/connect-common/src/constants/errors';

import { type ConnectSerializedError } from './connectPopupTypes';

export type ConnectV9ErrorPayload = Partial<ConnectSerializedError> & {
    error: string;
};

/**
 * Builds the `payload` of a failed Suite desktop response for Connect 9 clients. They show the
 * error text from `payload.error` and decide about a fallback by `payload.code`, so both are
 * needed. Connect 10 clients read only the `error` field of the response and ignore this payload.
 *
 * How Connect 9.7.3 handles the response:
 * - The failed response type, with `payload.error` and `payload.code`:
 *   https://github.com/trezor/trezor-suite/blob/40fe590051403f0c7c01012d652e0c30b10f645a/packages/connect/src/types/params.ts#L51-L54
 * - connect-web passes the Suite desktop response to the app as it is:
 *   https://github.com/trezor/trezor-suite/blob/40fe590051403f0c7c01012d652e0c30b10f645a/packages/connect-web/src/impl/core-in-suite-desktop.ts#L149-L179
 * - The fallback decision reads `payload.code`:
 *   https://github.com/trezor/trezor-suite/blob/40fe590051403f0c7c01012d652e0c30b10f645a/packages/connect/src/impl/dynamic.ts#L153-L158
 * - The codes that make connect-web leave Suite desktop:
 *   https://github.com/trezor/trezor-suite/blob/40fe590051403f0c7c01012d652e0c30b10f645a/packages/connect-web/src/index.ts#L75-L83
 *
 * How Connect 10 handles it, reading only `error`:
 * - https://github.com/trezor/trezor-suite/blob/8e437979f2db9e88fd5d279fae1eea7dddab5a81/packages/connect-web/src/impl/core-in-suite-desktop.ts#L156-L161
 * - https://github.com/trezor/trezor-suite/blob/8e437979f2db9e88fd5d279fae1eea7dddab5a81/packages/connect-common/src/impl/dynamic.ts#L120-L125
 */
export const toConnectV9ErrorPayload = (
    error: Partial<ConnectSerializedError> | undefined,
): ConnectV9ErrorPayload => ({
    ...error,
    // Connect 9 types `payload.error` as a required string, so fall back to the code and then to
    // a generic text.
    error: error?.message || error?.code || ERROR_CODES.Failure_UnknownCode,
});
