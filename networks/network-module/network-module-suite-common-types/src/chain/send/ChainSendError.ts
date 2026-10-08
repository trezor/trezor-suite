import type { ERRORS } from '@trezor/connect-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type ChainSendErrorCode =
    | 'compose-failed'
    | 'fee-estimation-failed'
    | 'sign-failed'
    | 'push-failed'
    | 'push-pending-conflict';

/**
 * What the user should be told about a failure the form cannot show, decided by the network:
 * `message` shows the error's message, `fee-estimation` says the fee could not be estimated.
 */
export type ChainSendNotice = 'message' | 'fee-estimation';

/**
 * What composing, signing or broadcasting throws.
 *
 * Unlike `ChainNetworkError` it keeps Connect's message, which the app shows to the user and reads
 * the device outcome from (`tx-cancelled`, `tx-timeout`). The message can name addresses or amounts,
 * so it is for local display only: never log or report it.
 */
export class ChainSendError extends Error {
    readonly code: ChainSendErrorCode;
    readonly symbol: NetworkSymbol;

    /** Connect's error code, when the failure came from Connect. */
    readonly connectErrorCode?: ERRORS.ErrorCode;

    /** Set when the user should be told; otherwise the failure only clears the form's result. */
    readonly notify?: ChainSendNotice;

    constructor(
        code: ChainSendErrorCode,
        symbol: NetworkSymbol,
        message: string,
        connectErrorCode?: ERRORS.ErrorCode,
        notify?: ChainSendNotice,
    ) {
        super(message);
        this.name = 'ChainSendError';
        this.code = code;
        this.symbol = symbol;
        this.connectErrorCode = connectErrorCode;
        this.notify = notify;
    }
}

/**
 * A failed Connect compose is shown to the user, except invalid input, which the form already
 * flags on its fields.
 */
export const getComposeFailureNotice = (
    connectErrorCode: ERRORS.ErrorCode | undefined,
): ChainSendNotice | undefined =>
    connectErrorCode !== undefined && connectErrorCode !== 'Method_InvalidParameter'
        ? 'message'
        : undefined;
