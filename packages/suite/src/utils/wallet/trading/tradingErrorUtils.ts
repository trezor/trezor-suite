import { type TranslationKey, isTranslationKey } from '@suite/intl';
import {
    type TradingError,
    type TradingErrorCode,
    getTradingErrorCauseMessage,
} from '@suite-common/trading';

type TradingErrorTranslation = {
    id: TranslationKey;
    values?: Record<string, string>;
};

const TRADING_ERROR_TRANSLATION_KEYS: Record<TradingErrorCode, TranslationKey> = {
    'cannot-send-transaction': 'TR_TRADING_CANNOT_SEND_TRANSACTION',
    'sign-transaction-failed': 'TR_TRADING_SIGN_TRANSACTION_FAILED',
    'push-transaction-failed': 'TR_TRADING_PUSH_TRANSACTION_FAILED',
    'cannot-create-transaction': 'TR_TRADING_CANNOT_CREATE_TRANSACTION',
    'compose-failed': 'TR_TRADING_COMPOSE_FAILED',
    'missing-composed-data': 'TR_TRADING_MISSING_COMPOSED_DATA',
    'missing-fee-level': 'TR_TRADING_MISSING_FEE_LEVEL',
    'incorrect-serialized-data': 'TR_TRADING_INCORRECT_SERIALIZED_DATA',
    'refresh-transaction-failed': 'TR_TRADING_REFRESH_TRANSACTION_FAILED',
    'no-response': 'TR_TRADING_NO_RESPONSE',
    'invalid-response': 'TR_TRADING_INVALID_RESPONSE',
    'payment-requests-failed': 'TR_PAYMENT_REQUESTS_ERROR',
    'device-not-connected': 'TR_DEVICE_NOT_CONNECTED',
    'nonce-failed': 'TR_NONCE_ERROR',
    'verify-address-failed': 'TR_VERIFY_ERROR',
};

const getTranslationValues = (
    { code }: TradingError,
    causeMessage: string | undefined,
): TradingErrorTranslation['values'] => {
    if (!causeMessage) {
        return undefined;
    }

    if (code === 'compose-failed') {
        return { error: causeMessage };
    }

    if (code === 'invalid-response') {
        return { error: `(${causeMessage})` };
    }

    return undefined;
};

export const getTradingErrorTranslation = (tradingError: TradingError): TradingErrorTranslation => {
    const { code, cause } = tradingError;

    // The composer already explains why the transaction cannot be created, e.g. insufficient funds.
    if (cause?.source === 'precompose' && isTranslationKey(cause.errorMessage.id)) {
        return { id: cause.errorMessage.id, values: cause.errorMessage.values };
    }

    const values = getTranslationValues(tradingError, getTradingErrorCauseMessage(cause));

    return values
        ? { id: TRADING_ERROR_TRANSLATION_KEYS[code], values }
        : { id: TRADING_ERROR_TRANSLATION_KEYS[code] };
};
