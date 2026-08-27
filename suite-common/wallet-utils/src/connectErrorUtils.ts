import { type SerializedError } from '@trezor/connect-common/src/constants/errors';

export const createSafeConnectError = (error: SerializedError, method: string) =>
    new Error(`${method} failed: ${error.code}`, { cause: error.code });
