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
        ])('testing getAmountLimits exchange function case %s', (_m, quotes, expectedResult) => {
            const amountLimits = exchangeUtils.getAmountLimits({ quotes, currency });

            expect(amountLimits).toStrictEqual(expectedResult);
        });
    });
});
