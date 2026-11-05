import { isArrayMember } from '@trezor/utils';

import {
    type TradingError,
    type TradingErrorCause,
    type TradingErrorCode,
    type TradingSignAndPushError,
} from '../types';

const TRADING_ERROR_TYPES = [
    'error',
    'sign-tx-error',
    'sign-transaction-timeout',
    'sign-cancelled',
] as const;

const SILENT_TRADING_ERROR_TYPES = ['sign-transaction-timeout', 'sign-cancelled'] as const;

const TRADING_ERROR_CODES: Record<TradingErrorCode, true> = {
    'cannot-send-transaction': true,
    'cannot-create-transaction': true,
    'compose-failed': true,
    'missing-composed-data': true,
    'missing-fee-level': true,
    'incorrect-serialized-data': true,
    'refresh-transaction-failed': true,
    'no-response': true,
    'invalid-response': true,
    'payment-requests-failed': true,
    'device-not-connected': true,
    'nonce-failed': true,
    'verify-address-failed': true,
};

type SilentTradingError = Extract<
    TradingError,
    { type: (typeof SILENT_TRADING_ERROR_TYPES)[number] }
>;

/**
 * Whether the user already knows why the trading flow stopped, so the error is not shown.
 */
export const isSilentTradingError = (error: TradingError): error is SilentTradingError =>
    isArrayMember(error.type, SILENT_TRADING_ERROR_TYPES);

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isKeyOf = <TRecord extends object>(record: TRecord, key: unknown): key is keyof TRecord =>
    typeof key === 'string' && Object.hasOwn(record, key);

const isOptionalString = (value: unknown): value is string | undefined =>
    value === undefined || typeof value === 'string';

const isTradingErrorCode = (value: unknown): value is TradingErrorCode =>
    isKeyOf(TRADING_ERROR_CODES, value);

const hasSerializedConnectError = (error: Record<string, unknown>) =>
    isObject(error.metadata) &&
    isObject(error.metadata.error) &&
    typeof error.metadata.error.message === 'string';

const hasConnectCodeAndMessage = (error: Record<string, unknown>) =>
    isOptionalString(error.errorCode) && isOptionalString(error.message);

const SIGN_AND_PUSH_ERROR_VALIDATORS: Record<
    TradingSignAndPushError['error'],
    (error: Record<string, unknown>) => boolean
> = {
    'fee-levels-compose-failed': error => isOptionalString(error.message),
    'enhance-transaction-failed': error => typeof error.message === 'string',
    'sign-transaction-failed': hasConnectCodeAndMessage,
    'sign-transaction-timeout': hasConnectCodeAndMessage,
    'push-transaction-failed': hasSerializedConnectError,
    'push-transaction-pending-conflict': hasSerializedConnectError,
    'push-approval-rejected': () => true,
};

const isTradingSignAndPushError = (value: unknown): value is TradingSignAndPushError =>
    isObject(value) &&
    isKeyOf(SIGN_AND_PUSH_ERROR_VALIDATORS, value.error) &&
    SIGN_AND_PUSH_ERROR_VALIDATORS[value.error](value);

const TRADING_ERROR_CAUSE_VALIDATORS: Record<
    TradingErrorCause['source'],
    (cause: Record<string, unknown>) => boolean
> = {
    'send-form': cause => isTradingSignAndPushError(cause.error),
    precompose: cause =>
        isObject(cause.errorMessage) &&
        typeof cause.errorMessage.id === 'string' &&
        (cause.errorMessage.values === undefined || isObject(cause.errorMessage.values)),
    connect: cause => isOptionalString(cause.code) && typeof cause.message === 'string',
    invity: cause => typeof cause.message === 'string',
    unexpected: cause => isOptionalString(cause.message),
};

const isTradingErrorCause = (value: unknown): value is TradingErrorCause =>
    isObject(value) &&
    isKeyOf(TRADING_ERROR_CAUSE_VALIDATORS, value.source) &&
    TRADING_ERROR_CAUSE_VALIDATORS[value.source](value);

export const isTradingError = (error: unknown): error is TradingError => {
    if (!isObject(error)) {
        return false;
    }

    const { type, code, cause } = error;

    if (typeof type !== 'string' || !isArrayMember(type, TRADING_ERROR_TYPES)) {
        return false;
    }

    if (!isTradingErrorCode(code)) {
        return false;
    }

    return cause === undefined || isTradingErrorCause(cause);
};
