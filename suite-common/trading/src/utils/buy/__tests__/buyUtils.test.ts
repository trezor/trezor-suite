import * as fixtures from '../__fixtures__/buyUtils';
import { buyUtils } from '../buyUtils';

describe('getAmountLimits', () => {
    const currency = 'bitcoin';

    it.each([
        [fixtures.QUOTE_REQUEST_FIAT, fixtures.MIN_MAX_QUOTES_OK, undefined],
        [fixtures.QUOTE_REQUEST_CRYPTO, fixtures.MIN_MAX_QUOTES_OK, undefined],
        [
            fixtures.QUOTE_REQUEST_FIAT,
            fixtures.MIN_MAX_QUOTES_LOW,
            {
                currency: 'EUR',
                minFiat: '20',
            },
        ],
        [
            fixtures.QUOTE_REQUEST_CRYPTO,
            fixtures.MIN_MAX_QUOTES_LOW,
            {
                currency: 'bitcoin',
                minCrypto: '0.002',
            },
        ],
        [
            fixtures.QUOTE_REQUEST_FIAT,
            fixtures.MIN_MAX_QUOTES_HIGH,
            {
                currency: 'EUR',
                maxFiat: '17045',
            },
        ],
        [
            fixtures.QUOTE_REQUEST_CRYPTO,
            fixtures.MIN_MAX_QUOTES_HIGH,
            {
                currency: 'bitcoin',
                maxCrypto: '1.67212968',
            },
        ],
        [
            fixtures.QUOTE_REQUEST_CRYPTO,
            fixtures.EMPTY_AMOUNT_QUOTES,
            {
                currency: 'bitcoin',
                maxCrypto: '0.0001',
            },
        ],
    ])('testing getAmountLimits function case %#', (request, quotes, expectedResult) => {
        const amountLimits = buyUtils.getAmountLimits({ request, quotes, currency });

        expect(amountLimits).toStrictEqual(expectedResult);
    });
});
