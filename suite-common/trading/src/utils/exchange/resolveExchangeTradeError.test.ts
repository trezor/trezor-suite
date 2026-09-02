import type { CryptoId, TradeError } from 'invity-api';

import {
    getTradingErrorDisplay,
    isResolvedTradeError,
    resolveExchangeTradeError,
} from './resolveExchangeTradeError';

const coinSymbols: Record<string, string> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
};

const getCoinSymbol = (cryptoId: CryptoId) => coinSymbols[cryptoId];

describe('resolveExchangeTradeError', () => {
    it('returns unknown with the backend error as the message when errorDetails is missing', () => {
        const source: Partial<TradeError> = { error: 'Something broke' };

        expect(resolveExchangeTradeError(source)).toEqual({
            code: 'unknown',
            message: 'Something broke',
        });
    });

    it('returns unknown with nothing when the source is empty', () => {
        expect(resolveExchangeTradeError({})).toEqual({ code: 'unknown', message: undefined });
    });

    it('uses errorDetails.message as the message, ignoring the backend error', () => {
        const source: Partial<TradeError> = {
            error: 'Untranslated backend error',
            errorDetails: {
                origin: 'partner',
                externalCode: '-32602',
                message: 'The requested currency pair is not supported by this provider.',
                code: 'unknown',
            },
        };

        expect(resolveExchangeTradeError(source)).toEqual({
            code: 'unknown',
            message: 'The requested currency pair is not supported by this provider.',
        });
    });

    it('falls back to externalCode as the message when errorDetails.message is absent', () => {
        const source: Partial<TradeError> = {
            errorDetails: { origin: 'partner', externalCode: '-32602', code: 'unknown' },
        };

        expect(resolveExchangeTradeError(source)).toMatchObject({
            code: 'unknown',
            message: '-32602',
        });
    });

    it('returns no message when errorDetails carries neither message nor externalCode', () => {
        const source: Partial<TradeError> = {
            error: 'Backend went boom',
            errorDetails: { origin: 'partner', code: 'unknown' },
        };

        expect(resolveExchangeTradeError(source)).toEqual({
            code: 'unknown',
            message: undefined,
        });
    });

    describe('invalid_amount', () => {
        it('fills values when both bounds are present', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_amount',
                    amount: { key: 'BTC', value: '0.00001', min: '0.001', max: '5' },
                },
            };

            expect(resolveExchangeTradeError(source)).toEqual({
                code: 'invalid_amount',
                message: undefined,
                values: { min: '0.001', max: '5' },
            });
        });

        it('leaves values undefined (not {}) when a bound is missing, keeping the partner message', () => {
            const source: Partial<TradeError> = {
                error: 'raw backend error',
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_amount',
                    message: 'minimal amount is 0.669',
                    amount: { key: 'BTC', value: '0.00001', min: '0.669' },
                },
            };

            const result = resolveExchangeTradeError(source);

            expect(result.values).toBeUndefined();
            expect(result).toMatchObject({
                code: 'invalid_amount',
                message: 'minimal amount is 0.669',
            });
        });

        it('leaves values undefined when amount is absent', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'internal', code: 'invalid_amount' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('invalid_pair', () => {
        it('resolves cryptoIds into coin symbols', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_pair',
                    pair: { send: 'bitcoin', receive: 'ethereum' },
                },
            };

            expect(resolveExchangeTradeError(source, { getCoinSymbol }).values).toEqual({
                send: 'BTC',
                receive: 'ETH',
            });
        });

        it('resolves tokens to their precise symbol, not the network', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_pair',
                    pair: {
                        send: 'bitcoin',
                        receive: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7',
                    },
                },
            };

            expect(resolveExchangeTradeError(source, { getCoinSymbol }).values).toEqual({
                send: 'BTC',
                receive: 'USDT',
            });
        });

        it('falls back to the raw cryptoId when no resolver is supplied', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_pair',
                    pair: { send: 'bitcoin', receive: 'ethereum' },
                },
            };

            expect(resolveExchangeTradeError(source).values).toEqual({
                send: 'bitcoin',
                receive: 'ethereum',
            });
        });

        it('falls back to the raw cryptoId when the resolver returns undefined for it', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_pair',
                    pair: { send: 'dogecoin', receive: 'ethereum' },
                },
            };

            expect(resolveExchangeTradeError(source, { getCoinSymbol }).values).toEqual({
                send: 'dogecoin',
                receive: 'ETH',
            });
        });

        it('leaves values undefined when only one side is present', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_pair',
                    pair: { send: 'bitcoin', receive: '' },
                },
            };

            expect(resolveExchangeTradeError(source, { getCoinSymbol }).values).toBeUndefined();
        });

        it('leaves values undefined when pair is absent', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'internal', code: 'invalid_pair' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('invalid_address', () => {
        it('fills values with the address key', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_address',
                    address: { key: 'receiveAddress', value: 'bc1invalid' },
                },
            };

            expect(resolveExchangeTradeError(source).values).toEqual({ key: 'receiveAddress' });
        });

        it('leaves values undefined when the address key is absent', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'partner', code: 'invalid_address' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('unavailable', () => {
        it('fills values with entity type and value', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'internal',
                    code: 'unavailable',
                    entity: { type: 'partner', value: 'changelly' },
                    reason: 'maintenance',
                },
            };

            expect(resolveExchangeTradeError(source).values).toEqual({
                entityType: 'partner',
                entityValue: 'changelly',
            });
        });

        it('leaves values undefined when entity is incomplete', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'internal',
                    code: 'unavailable',
                    entity: { type: 'partner', value: '' },
                },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('invalid_input / invalid_response', () => {
        it('joins invalid_input inputs into a string', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'partner',
                    code: 'invalid_input',
                    inputs: ['fromAddress', 'refundAddress'],
                },
            };

            expect(resolveExchangeTradeError(source).values).toEqual({
                inputs: 'fromAddress, refundAddress',
            });
        });

        it('leaves invalid_input values undefined when there are no inputs', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'partner', code: 'invalid_input' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });

        it('joins invalid_response errors into a string', () => {
            const source: Partial<TradeError> = {
                errorDetails: {
                    origin: 'external',
                    code: 'invalid_response',
                    errors: ['missing rate', 'bad payload'],
                },
            };

            expect(resolveExchangeTradeError(source).values).toEqual({
                errors: 'missing rate, bad payload',
            });
        });

        it('leaves invalid_response values undefined when there are no errors', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'external', code: 'invalid_response' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('trade_not_found', () => {
        it('fills values with the id', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'partner', code: 'trade_not_found', id: 'abc123' },
            };

            expect(resolveExchangeTradeError(source).values).toEqual({ id: 'abc123' });
        });

        it('leaves values undefined when id is absent', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'partner', code: 'trade_not_found' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('trade lifecycle', () => {
        it.each(['trade_expired', 'trade_failed', 'trade_refunded'] as const)(
            'fills orderId for %s',
            code => {
                const source: Partial<TradeError> = {
                    errorDetails: { origin: 'partner', code, orderId: 'order-9' },
                };

                const result = resolveExchangeTradeError(source);

                expect(result.code).toBe(code);
                expect(result.values).toEqual({ orderId: 'order-9' });
            },
        );

        it('leaves values undefined when orderId is absent', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'partner', code: 'trade_failed' },
            };

            expect(resolveExchangeTradeError(source).values).toBeUndefined();
        });
    });

    describe('generic codes', () => {
        it('returns no_response with no values', () => {
            const source: Partial<TradeError> = {
                errorDetails: { origin: 'external', code: 'no_response' },
            };

            expect(resolveExchangeTradeError(source)).toEqual({
                code: 'no_response',
                message: undefined,
            });
        });

        it('returns unknown with the partner message', () => {
            const source: Partial<TradeError> = {
                error: 'weird',
                errorDetails: { origin: 'internal', externalCode: 'X1', code: 'unknown' },
            };

            expect(resolveExchangeTradeError(source)).toEqual({
                code: 'unknown',
                message: 'X1',
            });
        });

        it('degrades an unrecognized backend code to unknown without throwing', () => {
            const source = {
                error: 'raw backend error',
                errorDetails: {
                    origin: 'partner',
                    externalCode: 'X9',
                    message: 'Provider-specific explanation.',
                    code: 'future_code_from_api',
                },
            } as unknown as Partial<TradeError>;

            expect(() => resolveExchangeTradeError(source)).not.toThrow();
            expect(resolveExchangeTradeError(source)).toEqual({
                code: 'unknown',
                message: 'Provider-specific explanation.',
            });
        });
    });
});

describe('isResolvedTradeError', () => {
    it('returns true for a resolved trade error', () => {
        expect(isResolvedTradeError({ code: 'unknown' })).toBe(true);
    });

    it('returns false for a plain string', () => {
        expect(isResolvedTradeError('Server error')).toBe(false);
    });

    it('returns false for null and unrelated objects', () => {
        expect(isResolvedTradeError(null)).toBe(false);
        expect(isResolvedTradeError({ foo: 'bar' })).toBe(false);
    });
});

describe('getTradingErrorDisplay', () => {
    it('returns detailed with values when values are present', () => {
        expect(
            getTradingErrorDisplay({ values: { min: '1', max: '5' }, message: 'ignored' }),
        ).toEqual({ kind: 'detailed', values: { min: '1', max: '5' } });
    });

    it('returns base with the message when values are absent', () => {
        expect(getTradingErrorDisplay({ message: 'minimal amount is 0.669' })).toEqual({
            kind: 'base',
            message: 'minimal amount is 0.669',
        });
    });

    it('returns base without a message when nothing is present', () => {
        expect(getTradingErrorDisplay({})).toEqual({ kind: 'base', message: undefined });
    });
});
