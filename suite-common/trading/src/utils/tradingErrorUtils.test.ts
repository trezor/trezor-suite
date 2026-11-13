import {
    getConnectErrorCause,
    getSignAndPushRejectionError,
    getTradingErrorCauseMessage,
    toSendTransactionTradingError,
    toTradingError,
} from './tradingErrorUtils';
import { type TradingError, type TradingErrorCause, type TradingSignAndPushError } from '../types';

describe(toTradingError.name, () => {
    const fallback = { type: 'sign-tx-error', code: 'cannot-send-transaction' } as const;

    it('keeps a trading error as it is', () => {
        const tradingError: TradingError = {
            type: 'sign-transaction-timeout',
            code: 'cannot-send-transaction',
            cause: {
                source: 'send-form',
                error: { error: 'sign-transaction-timeout', message: 'Signing process timed out.' },
            },
        };

        expect(toTradingError(tradingError, fallback)).toBe(tradingError);
    });

    it.each<[string, unknown, string | undefined]>([
        ['a serialized error', { name: 'Error', message: 'Boom' }, 'Boom'],
        ['a thrown error', new Error('Boom'), 'Boom'],
        ['a string', 'Boom', 'Boom'],
        ['nothing', undefined, undefined],
    ])('wraps %s as an unexpected cause', (_, value, expectedMessage) => {
        expect(toTradingError(value, fallback)).toEqual({
            ...fallback,
            cause: { source: 'unexpected', message: expectedMessage },
        });
    });
});

describe(toSendTransactionTradingError.name, () => {
    it('wraps an unexpected failure as a failed send', () => {
        expect(toSendTransactionTradingError(new Error('Network error'))).toEqual({
            type: 'sign-tx-error',
            code: 'cannot-send-transaction',
            cause: { source: 'unexpected', message: 'Network error' },
        });
    });

    it('keeps a trading error as it is', () => {
        const tradingError: TradingError = { type: 'sign-cancelled', code: 'nonce-failed' };

        expect(toSendTransactionTradingError(tradingError)).toBe(tradingError);
    });
});

describe(getConnectErrorCause.name, () => {
    it('keeps the Connect code and message', () => {
        expect(getConnectErrorCause({ code: 'Method_Cancel', message: 'Cancelled' })).toEqual({
            source: 'connect',
            code: 'Method_Cancel',
            message: 'Cancelled',
        });
    });
});

describe('getSignAndPushRejectionError', () => {
    it('returns the send form error the step rejected with', () => {
        const pushError: TradingSignAndPushError = {
            error: 'push-transaction-failed',
            errorCode: 'Backend_Error',
            message: 'Blockhash not found',
        };

        expect(
            getSignAndPushRejectionError({ payload: pushError, error: { message: 'Rejected' } }),
        ).toBe(pushError);
    });

    it('keeps the thrown message as a signing failure when the step rejected without an error', () => {
        expect(getSignAndPushRejectionError({ error: { message: 'Unexpected failure' } })).toEqual({
            error: 'sign-transaction-failed',
            message: 'Unexpected failure',
        });
    });
});

describe(getTradingErrorCauseMessage.name, () => {
    it.each<[string, TradingErrorCause | undefined, string | undefined]>([
        ['no cause', undefined, undefined],
        [
            'a send form sign error',
            {
                source: 'send-form',
                error: {
                    error: 'sign-transaction-failed',
                    errorCode: 'Device_Disconnected',
                    message: 'Device disconnected',
                },
            },
            'Device disconnected',
        ],
        [
            'a send form push error',
            {
                source: 'send-form',
                error: {
                    error: 'push-transaction-failed',
                    errorCode: 'Backend_Error',
                    message: 'Blockhash not found',
                },
            },
            'Blockhash not found',
        ],
        [
            'a declined push approval',
            { source: 'send-form', error: { error: 'push-approval-rejected' } },
            undefined,
        ],
        [
            'a precompose error',
            { source: 'precompose', errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' } },
            undefined,
        ],
        [
            'a Connect error',
            { source: 'connect', code: 'Method_Cancel', message: 'Cancelled' },
            'Cancelled',
        ],
        ['an Invity error', { source: 'invity', message: 'Trade expired' }, 'Trade expired'],
        ['an unexpected error', { source: 'unexpected', message: 'Boom' }, 'Boom'],
    ])('returns the message of %s', (_, cause, expectedMessage) => {
        expect(getTradingErrorCauseMessage(cause)).toBe(expectedMessage);
    });
});
