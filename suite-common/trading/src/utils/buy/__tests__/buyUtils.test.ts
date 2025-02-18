import * as fixtures from '../__fixtures__/buyUtils';
import { buyUtils } from '../buyUtils';

describe('getAmountLimits', () => {
    it('should test all scenarios', () => {
        const currency = 'bitcoin';

        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_FIAT,
                quotes: fixtures.MIN_MAX_QUOTES_OK,
                currency,
            }),
        ).toBe(undefined);
        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_CRYPTO,
                quotes: fixtures.MIN_MAX_QUOTES_OK,
                currency,
            }),
        ).toBe(undefined);

        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_FIAT,
                quotes: fixtures.MIN_MAX_QUOTES_LOW,
                currency,
            }),
        ).toStrictEqual({
            currency: 'EUR',
            minFiat: '20',
        });
        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_CRYPTO,
                quotes: fixtures.MIN_MAX_QUOTES_LOW,
                currency,
            }),
        ).toStrictEqual({
            currency: 'bitcoin',
            minCrypto: '0.002',
        });

        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_FIAT,
                quotes: fixtures.MIN_MAX_QUOTES_HIGH,
                currency,
            }),
        ).toStrictEqual({
            currency: 'EUR',
            maxFiat: '17045',
        });

        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_CRYPTO,
                quotes: fixtures.MIN_MAX_QUOTES_HIGH,
                currency,
            }),
        ).toStrictEqual({
            currency: 'bitcoin',
            maxCrypto: '1.67212968',
        });

        expect(
            buyUtils.getAmountLimits({
                request: fixtures.QUOTE_REQUEST_CRYPTO,
                quotes: fixtures.EMPTY_AMOUNT_QUOTES,
                currency,
            }),
        ).toStrictEqual({
            currency: 'bitcoin',
            maxCrypto: '0.0001',
        });
    });
});
