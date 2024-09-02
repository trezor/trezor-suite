import * as fixtures from '../__fixtures__/buyUtils';
import { getAmountLimits, createQuoteLink, getStatusMessage, createTxLink } from '../buyUtils';

const {
    QUOTE_REQUEST_FIAT,
    QUOTE_REQUEST_CRYPTO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_LOW,
    MIN_MAX_QUOTES_HIGH,
} = fixtures;

describe('coinmarket/buy utils', () => {
    it('getAmountLimits', () => {
        expect(getAmountLimits({ ...QUOTE_REQUEST_FIAT }, MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits({ ...QUOTE_REQUEST_CRYPTO }, MIN_MAX_QUOTES_OK)).toBe(undefined);

        expect(getAmountLimits(QUOTE_REQUEST_FIAT, MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'EUR',
            minFiat: 20,
        });
        expect(getAmountLimits(QUOTE_REQUEST_CRYPTO, MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'BTC',
            minCrypto: 0.002,
        });

        expect(getAmountLimits(QUOTE_REQUEST_FIAT, MIN_MAX_QUOTES_HIGH)).toStrictEqual({
            currency: 'EUR',
            maxFiat: 17045.0,
        });
        expect(getAmountLimits(QUOTE_REQUEST_CRYPTO, MIN_MAX_QUOTES_HIGH)).toStrictEqual({
            currency: 'BTC',
            maxCrypto: 1.67212968,
        });
    });

    it('createQuoteLink', async () => {
        const accountMock = {
            index: 1,
            accountType: 'normal',
            symbol: 'btc',
        };
        // @ts-expect-error
        expect(await createQuoteLink(QUOTE_REQUEST_FIAT, accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qf/CZ/EUR/10/BTC`,
        );
        // @ts-expect-error
        expect(await createQuoteLink(QUOTE_REQUEST_CRYPTO, accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qc/CZ/EUR/0.001/BTC`,
        );
    });

    it('createTxLink', async () => {
        const accountMock = {
            index: 1,
            accountType: 'normal',
            symbol: 'btc',
        };
        // @ts-expect-error
        expect(await createTxLink(MIN_MAX_QUOTES_OK[0], accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#detail/btc/normal/1/e709df77-ee9e-4d12-98c2-84004a19c546`,
        );
    });

    it('getStatusMessage', () => {
        expect(getStatusMessage('LOGIN_REQUEST')).toBe('TR_BUY_STATUS_PENDING');
        expect(getStatusMessage('APPROVAL_PENDING')).toBe('TR_BUY_STATUS_PENDING');
        expect(getStatusMessage('SUBMITTED')).toBe('TR_BUY_STATUS_PENDING_GO_TO_GATEWAY');
        expect(getStatusMessage('BLOCKED')).toBe('TR_BUY_STATUS_ERROR');
        expect(getStatusMessage('ERROR')).toBe('TR_BUY_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_BUY_STATUS_SUCCESS');
    });
});
