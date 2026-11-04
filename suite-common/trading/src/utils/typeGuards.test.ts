import { isSilentSendRejection, isTradingError } from './typeGuards';
import { type TradingErrorCause } from '../types';

describe('typeGuards', () => {
    describe('isTradingError', () => {
        it('returns true for a trading error without a cause', () => {
            expect(isTradingError({ type: 'error', code: 'cannot-send-transaction' })).toBe(true);
        });

        it('returns true for a trading error with a cause', () => {
            expect(
                isTradingError({
                    type: 'sign-tx-error',
                    code: 'cannot-send-transaction',
                    cause: {
                        source: 'send-form',
                        error: { error: 'sign-transaction-failed', message: 'Device disconnected' },
                    },
                }),
            ).toBe(true);
        });

        it.each<[string, TradingErrorCause]>([
            [
                'push',
                {
                    source: 'send-form',
                    error: {
                        error: 'push-transaction-failed',
                        metadata: {
                            success: false,
                            error: { code: 'Backend_Error', message: 'Blockhash not found' },
                        },
                    },
                },
            ],
            ['push approval', { source: 'send-form', error: { error: 'push-approval-rejected' } }],
            [
                'precompose',
                {
                    source: 'precompose',
                    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH', values: { symbol: 'BTC' } },
                },
            ],
            ['connect', { source: 'connect', code: 'Method_Cancel', message: 'Cancelled' }],
            ['invity', { source: 'invity', message: 'Network error' }],
            ['unexpected', { source: 'unexpected' }],
        ])('returns true for a %s cause', (_, cause) => {
            expect(isTradingError({ type: 'error', code: 'cannot-send-transaction', cause })).toBe(
                true,
            );
        });

        it.each<[string, unknown]>([
            ['an unknown source', { source: 'unknown', message: 'Failed' }],
            ['a send form cause without an error', { source: 'send-form' }],
            [
                'a send form cause with an unknown error',
                { source: 'send-form', error: { error: 'unknown-error' } },
            ],
            [
                'a push cause without Connect metadata',
                { source: 'send-form', error: { error: 'push-transaction-failed' } },
            ],
            ['a precompose cause without a message', { source: 'precompose' }],
            ['a connect cause without a message', { source: 'connect', code: 'Method_Cancel' }],
            ['an invity cause with a non-string message', { source: 'invity', message: 42 }],
        ])('returns false for %s', (_, cause) => {
            expect(isTradingError({ type: 'error', code: 'cannot-send-transaction', cause })).toBe(
                false,
            );
        });

        it('returns true for a cancelled signing', () => {
            expect(
                isTradingError({ type: 'sign-cancelled', code: 'cannot-send-transaction' }),
            ).toBe(true);
        });

        it('returns false for invalid shape', () => {
            expect(isTradingError(undefined)).toBe(false);
            expect(isTradingError({ type: 'error' })).toBe(false);
            expect(isTradingError({ type: 'invalid-type', code: 'cannot-send-transaction' })).toBe(
                false,
            );
            expect(
                isTradingError({ type: 'error', code: 'TR_TRADING_CANNOT_SEND_TRANSACTION' }),
            ).toBe(false);
            expect(
                isTradingError({
                    type: 'error',
                    code: 'cannot-send-transaction',
                    cause: 'invalid',
                }),
            ).toBe(false);
            expect(
                isTradingError({
                    type: 'error',
                    error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
                }),
            ).toBe(false);
        });
    });

    describe('isSilentSendRejection', () => {
        it('is silent for a cancelled signing and for a signing timeout', () => {
            expect(isSilentSendRejection('sign-cancelled')).toBe(true);
            expect(isSilentSendRejection('sign-transaction-timeout')).toBe(true);
        });

        it('is not silent for errors that nothing else reports', () => {
            expect(isSilentSendRejection('error')).toBe(false);
            expect(isSilentSendRejection('sign-tx-error')).toBe(false);
        });
    });
});
