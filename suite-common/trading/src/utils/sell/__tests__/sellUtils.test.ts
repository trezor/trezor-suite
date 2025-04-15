import { sellUtilsFixtures } from '../__fixtures__/sellUtils';
import { sellUtils } from '../sellUtils';

describe('sellUtils', () => {
    describe('getAmountLimits', () => {
        const currency = 'bitcoin';

        it.each([
            [
                'should return undefined when found at least one correct quote for sending request in fiat',
                sellUtilsFixtures.QUOTE_REQUEST_FIAT,
                sellUtilsFixtures.MIN_MAX_QUOTES_OK,
                undefined,
            ],
            [
                'should return undefined when found at least one correct quote for sending request in crypto',
                sellUtilsFixtures.QUOTE_REQUEST_CRYPTO,
                sellUtilsFixtures.MIN_MAX_QUOTES_OK,
                undefined,
            ],
            [
                'should return amountLimits with minCrypto when all quotes are below minimum for sending request in fiat',
                sellUtilsFixtures.QUOTE_REQUEST_FIAT,
                sellUtilsFixtures.MIN_MAX_QUOTES_LOW,
                {
                    currency: 'EUR',
                    minFiat: '20',
                },
            ],
            [
                'should return amountLimits with minCrypto when all quotes are below minimum for sending request in crypto',
                sellUtilsFixtures.QUOTE_REQUEST_CRYPTO,
                sellUtilsFixtures.MIN_MAX_QUOTES_LOW,
                {
                    currency: 'bitcoin',
                    minCrypto: '0.002',
                },
            ],
            [
                'should return amountLimits with maxCrypto when all quotes are above maximum for sending request in fiat',
                sellUtilsFixtures.QUOTE_REQUEST_FIAT,
                sellUtilsFixtures.MIN_MAX_QUOTES_HIGH,
                {
                    currency: 'EUR',
                    maxFiat: '17045',
                },
            ],
            [
                'should return amountLimits with maxCrypto when all quotes are above maximum for sending request in crypto',
                sellUtilsFixtures.QUOTE_REQUEST_CRYPTO,
                sellUtilsFixtures.MIN_MAX_QUOTES_HIGH,
                {
                    currency: 'bitcoin',
                    maxCrypto: '1.67212968',
                },
            ],
        ])('%s', (_m, request, quotes, expectedResult) => {
            const amountLimits = sellUtils.getAmountLimits({ request, quotes, currency });

            expect(amountLimits).toStrictEqual(expectedResult);
        });
    });

    describe('formatIban', () => {
        it('should stay stable', () => {
            expect(sellUtils.formatIban('SE35 5000 0000 0549 1000 0003')).toEqual(
                'SE35 5000 0000 0549 1000 0003',
            );
        });

        it('should format correctly', () => {
            expect(sellUtils.formatIban('CH9300762011623852957')).toEqual(
                'CH93 0076 2011 6238 5295 7',
            );
        });
    });

    describe('getStatusMessage', () => {
        it.each([
            ['PENDING' as const, 'TR_SELL_STATUS_PENDING'],
            ['SUBMITTED' as const, 'TR_SELL_STATUS_PENDING'],
            ['ERROR' as const, 'TR_SELL_STATUS_ERROR'],
            ['BLOCKED' as const, 'TR_SELL_STATUS_ERROR'],
            ['CANCELLED' as const, 'TR_SELL_STATUS_ERROR'],
            ['REFUNDED' as const, 'TR_SELL_STATUS_ERROR'],
            ['SUCCESS' as const, 'TR_SELL_STATUS_SUCCESS'],
            ['LOGIN_REQUEST' as const, 'TR_SELL_STATUS_PENDING'],
            ['SITE_ACTION_REQUEST' as const, 'TR_SELL_STATUS_PENDING'],
        ])('should return %s for %s', (status, expected) => {
            expect(sellUtils.getStatusMessage(status)).toBe(expected);
        });
    });
});
