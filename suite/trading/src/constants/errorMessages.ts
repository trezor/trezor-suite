import type { ErrorCode } from 'invity-api';

import { type TranslationKey } from '@suite/intl';

export const TRADING_ERROR_MESSAGE: Record<
    ErrorCode,
    { detailed?: TranslationKey; base: TranslationKey }
> = {
    invalid_amount: {
        detailed: 'TR_TRADING_ERROR_INVALID_AMOUNT_DETAILED',
        base: 'TR_TRADING_ERROR_INVALID_AMOUNT',
    },
    invalid_pair: {
        detailed: 'TR_TRADING_ERROR_INVALID_PAIR_DETAILED',
        base: 'TR_TRADING_ERROR_INVALID_PAIR',
    },
    invalid_address: {
        detailed: 'TR_TRADING_ERROR_INVALID_ADDRESS_DETAILED',
        base: 'TR_TRADING_ERROR_INVALID_ADDRESS',
    },
    unavailable: {
        detailed: 'TR_TRADING_ERROR_UNAVAILABLE_DETAILED',
        base: 'TR_TRADING_ERROR_UNAVAILABLE',
    },
    invalid_input: {
        detailed: 'TR_TRADING_ERROR_INVALID_INPUT_DETAILED',
        base: 'TR_TRADING_ERROR_INVALID_INPUT',
    },
    invalid_response: {
        detailed: 'TR_TRADING_ERROR_INVALID_RESPONSE_DETAILED',
        base: 'TR_TRADING_ERROR_INVALID_RESPONSE',
    },
    trade_not_found: {
        detailed: 'TR_TRADING_ERROR_TRADE_NOT_FOUND_DETAILED',
        base: 'TR_TRADING_ERROR_TRADE_NOT_FOUND',
    },
    trade_expired: {
        detailed: 'TR_TRADING_ERROR_TRADE_EXPIRED_DETAILED',
        base: 'TR_TRADING_ERROR_TRADE_EXPIRED',
    },
    trade_failed: {
        detailed: 'TR_TRADING_ERROR_TRADE_FAILED_DETAILED',
        base: 'TR_TRADING_ERROR_TRADE_FAILED',
    },
    trade_refunded: {
        detailed: 'TR_TRADING_ERROR_TRADE_REFUNDED_DETAILED',
        base: 'TR_TRADING_ERROR_TRADE_REFUNDED',
    },
    no_response: { base: 'TR_TRADING_ERROR_NO_RESPONSE' },
    unknown: { base: 'TR_TRADING_ERROR_UNKNOWN' },
};
