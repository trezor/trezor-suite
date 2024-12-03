import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import * as fixtures from 'src/utils/wallet/coinmarket/__fixtures__/buyUtils';
import {
    getAmountLimits,
    createQuoteLink,
    getStatusMessage,
    createTxLink,
} from 'src/utils/wallet/coinmarket/buyUtils';

const {
    QUOTE_REQUEST_FIAT,
    QUOTE_REQUEST_CRYPTO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_LOW,
    MIN_MAX_QUOTES_HIGH,
    EMPTY_AMOUNT_QUOTES,
} = fixtures;

jest.mock('src/hooks/wallet/coinmarket/useCoinmarketInfo', () => ({
    ...jest.requireActual('src/hooks/wallet/coinmarket/useCoinmarketInfo'),
    useCoinmarketInfo: jest.fn(),
}));

describe('coinmarket/buy utils', () => {
    it('getAmountLimits', () => {
        const cryptoIdToCoinSymbol = (useCoinmarketInfo as jest.Mock).mockImplementation(
            () => 'BTC',
        );

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_FIAT,
                quotes: MIN_MAX_QUOTES_OK,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toBe(undefined);
        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: MIN_MAX_QUOTES_OK,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toBe(undefined);

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_FIAT,
                quotes: MIN_MAX_QUOTES_LOW,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'EUR',
            minFiat: '20',
        });
        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: MIN_MAX_QUOTES_LOW,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'btc',
            minCrypto: '0.002',
        });

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_FIAT,
                quotes: MIN_MAX_QUOTES_HIGH,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'EUR',
            maxFiat: '17045',
        });

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: MIN_MAX_QUOTES_HIGH,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'btc',
            maxCrypto: '1.67212968',
        });

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: EMPTY_AMOUNT_QUOTES,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'btc',
            maxCrypto: '0.0001',
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
            `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qf/CZ/EUR/10/bitcoin`,
        );
        // @ts-expect-error
        expect(await createQuoteLink(QUOTE_REQUEST_CRYPTO, accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qc/CZ/EUR/0.001/bitcoin`,
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
