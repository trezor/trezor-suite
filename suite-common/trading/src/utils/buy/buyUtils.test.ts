import * as fixtures from './__fixtures__/buyUtils';
import { buyUtils } from './buyUtils';

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

describe('getStatusMessage', () => {
    it.each([
        ['LOGIN_REQUEST' as const, 'TR_BUY_STATUS_PENDING'],
        ['APPROVAL_PENDING' as const, 'TR_BUY_STATUS_PENDING'],
        ['SUBMITTED' as const, 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY'],
        ['WAITING_FOR_USER' as const, 'TR_BUY_STATUS_ACTION_REQUIRED'],
        ['BLOCKED' as const, 'TR_BUY_STATUS_ERROR'],
        ['ERROR' as const, 'TR_BUY_STATUS_ERROR'],
        ['SUCCESS' as const, 'TR_BUY_STATUS_SUCCESS'],
    ])('should return %s for %s', (status, expected) => {
        expect(buyUtils.getStatusMessage(status)).toBe(expected);
    });
});
