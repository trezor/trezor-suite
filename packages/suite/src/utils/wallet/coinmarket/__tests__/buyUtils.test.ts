import * as fixtures from '../__fixtures__/buyUtils';
import {
    getAmountLimits,
    processQuotes,
    createQuoteLink,
    getStatusMessage,
    getCountryLabelParts,
    getCryptoOptions,
    createTxLink,
} from '../buyUtils';

const {
    QUOTE_REQUEST_FIAT,
    QUOTE_REQUEST_CRYPTO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_LOW,
    MIN_MAX_QUOTES_HIGH,
    ALTERNATIVE_QUOTES,
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

    it('processQuotes', () => {
        const onlyBaseQuotes = MIN_MAX_QUOTES_OK.map(q => ({ ...q }));
        const withAlternative = ALTERNATIVE_QUOTES.map(q => ({ ...q }));

        expect(processQuotes([])).toStrictEqual([[], []]);

        expect(processQuotes(onlyBaseQuotes)).toStrictEqual([onlyBaseQuotes, []]);
        expect(processQuotes(withAlternative)).toStrictEqual([
            withAlternative.filter(q => !q.tags || !q.tags.includes('alternativeCurrency')),
            withAlternative.filter(q => q.tags && q.tags.includes('alternativeCurrency')),
        ]);
    });

    it('createQuoteLink', async () => {
        const accountMock = {
            index: 1,
            accountType: 'normal',
            symbol: 'btc',
        };
        // @ts-ignore
        expect(await createQuoteLink(QUOTE_REQUEST_FIAT, accountMock)).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#offers/btc/normal/1/qf/CZ/EUR/10/BTC`,
        );
        // @ts-ignore
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
        // @ts-ignore
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

    it('getCryptoOptions', () => {
        expect(getCryptoOptions('btc', 'bitcoin')).toStrictEqual([
            {
                value: 'BTC',
                label: 'BTC',
            },
        ]);
        expect(getCryptoOptions('eth', 'ethereum')).toStrictEqual([
            {
                value: 'ETH',
                label: 'ETH',
            },
            {
                value: 'USDT20',
                label: 'USDT',
            },
            {
                value: 'DAI',
                label: 'DAI',
            },
            {
                value: 'GUSD',
                label: 'GUSD',
            },
        ]);
    });

    it('getCountryLabelParts', () => {
        expect(getCountryLabelParts('🇨🇿 Czech Republic')).toStrictEqual({
            flag: '🇨🇿',
            text: 'Czech Republic',
        });
        expect(getCountryLabelParts('aaa')).toStrictEqual({
            flag: '',
            text: 'aaa',
        });
    });
});
