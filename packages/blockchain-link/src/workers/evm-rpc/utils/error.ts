import { BaseError } from 'viem';

import { CustomError } from '@trezor/blockchain-link-types';

// Viem error messages are verbose multi-line reports. `details` carries the reason returned by
// the RPC node (e.g. "nonce too low"), `shortMessage` only viem's generic classification of it.
const getReason = (error: unknown) => {
    if (error instanceof BaseError) {
        return error.details || error.shortMessage;
    }

    if (error instanceof Error) {
        return error.message;
    }
};

export const toCustomError = (error: unknown, fallbackMessage: string) =>
    error instanceof CustomError ? error : new CustomError(getReason(error) || fallbackMessage);
