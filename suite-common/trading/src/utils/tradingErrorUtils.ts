import { type SignTransactionError, getSendFormErrorCause } from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

import { isTradingError } from './typeGuards';
import { type TradingError, type TradingErrorCause, type TradingSignAndPushError } from '../types';

const getUnexpectedErrorMessage = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'object' && value !== null && 'message' in value) {
        return typeof value.message === 'string' ? value.message : undefined;
    }

    return undefined;
};

/**
 * Passes a trading error through unchanged and wraps anything else, keeping its message as the cause.
 */
export const toTradingError = (
    value: unknown,
    fallback: Pick<TradingError, 'type' | 'code'>,
): TradingError =>
    isTradingError(value)
        ? value
        : {
              ...fallback,
              cause: { source: 'unexpected', message: getUnexpectedErrorMessage(value) },
          };

/**
 * Wraps a failure of sending a trading transaction, unless it already is a trading error.
 */
export const toSendTransactionTradingError = (value: unknown): TradingError =>
    toTradingError(value, { type: 'sign-tx-error', code: 'cannot-send-transaction' });

type ConnectErrorCause = Extract<TradingErrorCause, { source: 'connect' }>;

/**
 * Keeps the code and message of a failed Connect call as the cause of a trading error.
 */
export const getConnectErrorCause = ({
    code,
    message,
}: Omit<ConnectErrorCause, 'source'>): ConnectErrorCause => ({ source: 'connect', code, message });

type InvityErrorCause = Extract<TradingErrorCause, { source: 'invity' }>;

/**
 * Keeps the message of a failed trade API request as the cause of a trading error.
 */
export const getInvityErrorCause = (error: unknown): InvityErrorCause => ({
    source: 'invity',
    message: getUnexpectedErrorMessage(error) ?? String(error),
});

type RejectedSignAndPushStep<TError extends TradingSignAndPushError> = {
    payload?: TError;
    error: { message?: string };
};

export const getSignAndPushRejectionError = <TError extends TradingSignAndPushError>({
    payload,
    error,
}: RejectedSignAndPushStep<TError>): TError | SignTransactionError =>
    payload ?? { error: 'sign-transaction-failed', message: error.message };

/**
 * Reads the original message behind a trading error, if its source provided one.
 */
export const getTradingErrorCauseMessage = (
    cause: TradingErrorCause | undefined,
): string | undefined => {
    if (!cause) {
        return undefined;
    }

    switch (cause.source) {
        case 'send-form':
            return cause.error.error === 'push-approval-rejected'
                ? undefined
                : getSendFormErrorCause(cause.error).message;
        case 'precompose':
            return undefined;
        case 'connect':
        case 'invity':
        case 'unexpected':
            return cause.message;
        default:
            return exhaustive(cause);
    }
};
