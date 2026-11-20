import { type TradingErrorCode } from '@suite-common/trading';

import { getTradingErrorTranslation } from './tradingErrorUtils';

describe(getTradingErrorTranslation.name, () => {
    it.each<[TradingErrorCode, string]>([
        ['cannot-send-transaction', 'TR_TRADING_CANNOT_SEND_TRANSACTION'],
        ['sign-transaction-failed', 'TR_TRADING_SIGN_TRANSACTION_FAILED'],
        ['push-transaction-failed', 'TR_TRADING_PUSH_TRANSACTION_FAILED'],
        ['cannot-create-transaction', 'TR_TRADING_CANNOT_CREATE_TRANSACTION'],
        ['missing-composed-data', 'TR_TRADING_MISSING_COMPOSED_DATA'],
        ['missing-fee-level', 'TR_TRADING_MISSING_FEE_LEVEL'],
        ['incorrect-serialized-data', 'TR_TRADING_INCORRECT_SERIALIZED_DATA'],
        ['refresh-transaction-failed', 'TR_TRADING_REFRESH_TRANSACTION_FAILED'],
        ['no-response', 'TR_TRADING_NO_RESPONSE'],
        ['invalid-response', 'TR_TRADING_INVALID_RESPONSE'],
        ['payment-requests-failed', 'TR_PAYMENT_REQUESTS_ERROR'],
        ['device-not-connected', 'TR_DEVICE_NOT_CONNECTED'],
        ['nonce-failed', 'TR_NONCE_ERROR'],
        ['verify-address-failed', 'TR_VERIFY_ERROR'],
    ])('translates %s as %s', (code, expectedId) => {
        expect(getTradingErrorTranslation({ type: 'error', code })).toEqual({ id: expectedId });
    });

    it('fills the compose error message into the compose failure', () => {
        expect(
            getTradingErrorTranslation({
                type: 'sign-tx-error',
                code: 'compose-failed',
                cause: {
                    source: 'send-form',
                    error: { error: 'fee-levels-compose-failed', message: 'Not enough funds.' },
                },
            }),
        ).toEqual({ id: 'TR_TRADING_COMPOSE_FAILED', values: { error: 'Not enough funds.' } });
    });

    it('wraps the partner error of an invalid response in brackets', () => {
        expect(
            getTradingErrorTranslation({
                type: 'error',
                code: 'invalid-response',
                cause: { source: 'invity', message: 'Trade expired' },
            }),
        ).toEqual({ id: 'TR_TRADING_INVALID_RESPONSE', values: { error: '(Trade expired)' } });
    });

    it('uses the precompose translation when the composer explains the failure', () => {
        expect(
            getTradingErrorTranslation({
                type: 'sign-tx-error',
                code: 'cannot-create-transaction',
                cause: {
                    source: 'precompose',
                    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH', values: { symbol: 'BTC' } },
                },
            }),
        ).toEqual({ id: 'AMOUNT_IS_NOT_ENOUGH', values: { symbol: 'BTC' } });
    });
});
