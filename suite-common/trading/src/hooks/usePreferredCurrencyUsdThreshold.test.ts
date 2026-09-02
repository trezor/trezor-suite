import { calculatePreferredCurrencyUsdThreshold } from './usePreferredCurrencyUsdThreshold';

describe('calculatePreferredCurrencyUsdThreshold', () => {
    it('returns 0.1 for USD without rates', () => {
        expect(
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency: 'usd',
                btcUsdRate: undefined,
                btcBaseCurrencyRate: undefined,
            })?.toString(),
        ).toBe('0.1');
    });

    it('calculates the threshold through BTC cross-rates', () => {
        expect(
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency: 'czk',
                btcUsdRate: 50_000,
                btcBaseCurrencyRate: 1_100_000,
            })?.toString(),
        ).toBe('2.2');
    });

    it('returns null until required rates are available', () => {
        expect(
            calculatePreferredCurrencyUsdThreshold({
                baseCurrency: 'eur',
                btcUsdRate: 50_000,
                btcBaseCurrencyRate: undefined,
            }),
        ).toBeNull();
    });
});
