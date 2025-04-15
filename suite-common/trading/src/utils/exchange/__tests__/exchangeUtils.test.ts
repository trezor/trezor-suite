import { CryptoId } from 'invity-api';

import { exchangeUtilsFixtures } from '../__fixtures__/exchangeUtils';
import { exchangeUtils } from '../exchangeUtils';

describe('exchangeUtils', () => {
    describe('getAmountLimits', () => {
        const currency = 'bitcoin';

        it.each([
            [
                'should return undefined when found at least one correct quote',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_OK,
                undefined,
            ],
            [
                'should return amountLimits with minCrypto when all quotes are below minimum',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_LOW,
                {
                    currency,
                    maxCrypto: undefined,
                    minCrypto: '0.35121471511608626',
                },
            ],
            [
                'should return amountLimits with maxCrypto when all quotes are above maximum',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_HIGH,
                {
                    currency,
                    maxCrypto: '2',
                    minCrypto: undefined,
                },
            ],
            [
                'should return amountLimits undefined when all quotes contain error',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_CANNOT_TRADE,
                undefined,
            ],
        ])('%s', (_m, quotes, expectedResult) => {
            const amountLimits = exchangeUtils.getAmountLimits({ quotes, currency });

            expect(amountLimits).toStrictEqual(expectedResult);
        });
    });

    describe('isQuoteError', () => {
        it.each([
            [
                'should return false when quote is correct',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_OK[0],
                false,
            ],
            [
                'should return true when quote amount is below minimum',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_LOW[0],
                true,
            ],
            [
                'should return true when quote amount is above maximum',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_HIGH[0],
                true,
            ],
            [
                'should return true when quote is with error',
                exchangeUtilsFixtures.MIN_MAX_QUOTES_CANNOT_TRADE[0],
                true,
            ],
        ])('%s', (_m, quote, result) => {
            expect(exchangeUtils.isQuoteError(quote)).toBe(result);
        });
    });

    describe('fixedRateCexQuotes', () => {
        it('should return quotes with fixed rate', () => {
            expect(
                exchangeUtils.fixedRateCexQuotes(
                    [
                        ...exchangeUtilsFixtures.MIN_MAX_QUOTES_OK,
                        ...exchangeUtilsFixtures.MIN_MAX_QUOTES_CANNOT_TRADE,
                        ...exchangeUtilsFixtures.OTHER_QUOTES,
                    ],
                    exchangeUtilsFixtures.EXCHANGE_INFO,
                ),
            ).toStrictEqual([exchangeUtilsFixtures.MIN_MAX_QUOTES_OK[1]]);
        });
    });

    describe('floatRateCexQuotes', () => {
        it('should return quotes with float rate', () => {
            expect(
                exchangeUtils.floatRateCexQuotes(
                    [
                        ...exchangeUtilsFixtures.MIN_MAX_QUOTES_OK,
                        ...exchangeUtilsFixtures.MIN_MAX_QUOTES_CANNOT_TRADE,
                        ...exchangeUtilsFixtures.OTHER_QUOTES,
                    ],
                    exchangeUtilsFixtures.EXCHANGE_INFO,
                ),
            ).toStrictEqual([exchangeUtilsFixtures.MIN_MAX_QUOTES_OK[0]]);
        });
    });

    describe('getCexQuotesByRateType', () => {
        it.each([
            [
                'should return fixed rate quotes',
                'fixed' as const,
                exchangeUtilsFixtures.MIN_MAX_QUOTES_OK,
                [exchangeUtilsFixtures.MIN_MAX_QUOTES_OK[1]],
            ],
            [
                'should return floating rate quotes',
                'floating' as const,
                exchangeUtilsFixtures.MIN_MAX_QUOTES_OK,
                [exchangeUtilsFixtures.MIN_MAX_QUOTES_OK[0]],
            ],
        ])('%s', (_m, rateType, quotes, expectedResult) => {
            expect(
                exchangeUtils.getCexQuotesByRateType(
                    rateType,
                    quotes,
                    exchangeUtilsFixtures.EXCHANGE_INFO,
                ),
            ).toStrictEqual(expectedResult);
        });
    });

    describe('getSuccessQuotesOrdered', () => {
        it('should return quotes ordered by rate', () => {
            expect(
                exchangeUtils.getSuccessQuotesOrdered([
                    ...exchangeUtilsFixtures.MIN_MAX_QUOTES_OK,
                    ...exchangeUtilsFixtures.MIN_MAX_QUOTES_LOW,
                    ...exchangeUtilsFixtures.MIN_MAX_QUOTES_CANNOT_TRADE,
                ]),
            ).toStrictEqual(exchangeUtilsFixtures.EXCHANGE_SUCCESS_ORDERED_QUOTES);
        });
    });

    describe('getStatusMessage', () => {
        it.each([
            ['CONVERTING' as const, 'TR_EXCHANGE_STATUS_CONVERTING'],
            ['CONFIRMING' as const, 'TR_EXCHANGE_STATUS_CONFIRMING'],
            ['KYC' as const, 'TR_EXCHANGE_STATUS_KYC'],
            ['ERROR' as const, 'TR_EXCHANGE_STATUS_ERROR'],
            ['SUCCESS' as const, 'TR_EXCHANGE_STATUS_SUCCESS'],
        ])('should return correct translation when status is %s', (status, result) => {
            expect(exchangeUtils.getStatusMessage(status)).toBe(result);
        });
    });

    describe('tradingGetExchangeReceiveCryptoId', () => {
        it.each([
            ['bitcoin', undefined, 'ethereum'],
            ['litecoin', undefined, 'bitcoin'],
            ['ethereum--0x0000000000085d4780b73119b644ae5ecd22b376', undefined, 'bitcoin'],
            ['bitcoin', 'bitcoin', 'ethereum'],
            [
                'bitcoin',
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376',
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376',
            ],
        ])(
            'should select different receive currency than send currency %#',
            (sendCryptoId, receiveCryptoId, result) => {
                expect(
                    exchangeUtils.tradingGetExchangeReceiveCryptoId(
                        sendCryptoId as CryptoId,
                        receiveCryptoId as CryptoId | undefined,
                    ),
                ).toBe(result);
            },
        );
    });
});
