import type { ERRORS } from '@trezor/connect-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type ChainSendErrorCode =
    | 'compose-failed'
    | 'fee-estimation-failed'
    | 'sign-failed'
    | 'push-failed'
    | 'push-pending-conflict';

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

    constructor(
        code: ChainSendErrorCode,
        symbol: NetworkSymbol,
        message: string,
        connectErrorCode?: ERRORS.ErrorCode,
    ) {
        super(message);
        this.name = 'ChainSendError';
        this.code = code;
        this.symbol = symbol;
        this.connectErrorCode = connectErrorCode;
    }
}
