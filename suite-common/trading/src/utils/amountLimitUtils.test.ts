import { getTradingCryptoLimitAmount, getTradingFiatLimitAmount } from './amountLimitUtils';

type CryptoParams = Parameters<typeof getTradingCryptoLimitAmount>[0];

const cryptoParams: CryptoParams = {
    limit: 'min',
    amountLimits: { currency: 'ZEC', minCrypto: '0.02208', maxCrypto: '10' },
    isInSats: false,
    cryptoDecimals: 8,
};

describe(getTradingCryptoLimitAmount.name, () => {
    it('returns nothing when the limit is unknown', () => {
        expect(
            getTradingCryptoLimitAmount({ ...cryptoParams, amountLimits: { currency: 'ZEC' } }),
        ).toBeUndefined();
    });

    it('rounds the minimum up to the decimals of the field', () => {
        expect(
            getTradingCryptoLimitAmount({
                ...cryptoParams,
                amountLimits: { currency: 'ZEC', minCrypto: '0.123456781' },
            }),
        ).toBe('0.12345679');
    });

    it('rounds the maximum down to the decimals of the field', () => {
        expect(
            getTradingCryptoLimitAmount({
                ...cryptoParams,
                limit: 'max',
                amountLimits: { currency: 'ZEC', maxCrypto: '10.123456789' },
            }),
        ).toBe('10.12345678');
    });

    it.each([
        { limit: 'min', amount: '2' },
        { limit: 'max', amount: '1' },
    ] as const)('converts the $limit to whole sats for a field in sats', ({ limit, amount }) => {
        expect(
            getTradingCryptoLimitAmount({
                ...cryptoParams,
                limit,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.000000015',
                    maxCrypto: '0.000000015',
                },
                isInSats: true,
            }),
        ).toBe(amount);
    });

    it('keeps the limit in units when sats are on for a currency that has none', () => {
        expect(
            getTradingCryptoLimitAmount({
                ...cryptoParams,
                amountLimits: { currency: 'USDT', minCrypto: '10' },
                isInSats: true,
            }),
        ).toBe('10');
    });
});

describe(getTradingFiatLimitAmount.name, () => {
    const amountLimits = { currency: 'BTC', minFiat: '25.123', maxFiat: '1000.999' };

    it('returns the minimum rounded up to cents', () => {
        expect(getTradingFiatLimitAmount({ limit: 'min', amountLimits })).toBe('25.13');
    });

    it('returns the maximum rounded down to cents', () => {
        expect(getTradingFiatLimitAmount({ limit: 'max', amountLimits })).toBe('1000.99');
    });

    it('returns nothing when the limit is unknown', () => {
        expect(
            getTradingFiatLimitAmount({ limit: 'min', amountLimits: { currency: 'BTC' } }),
        ).toBeUndefined();
    });
});
