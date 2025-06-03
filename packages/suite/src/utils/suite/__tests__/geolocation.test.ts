import { shouldFetchCountryCode } from '../geolocation';

describe('shouldFetchCountryCode', () => {
    it('returns false if routeName is undefined', () => {
        expect(shouldFetchCountryCode(undefined)).toBe(false);
    });

    it('returns true for trading route', () => {
        expect(shouldFetchCountryCode('wallet-trading')).toBe(true);
        expect(shouldFetchCountryCode('wallet-trading-buy')).toBe(true);
        expect(shouldFetchCountryCode('wallet-trading-sell')).toBe(true);
        expect(shouldFetchCountryCode('wallet-trading-dca')).toBe(true);
    });

    it('returns true for staking route', () => {
        expect(shouldFetchCountryCode('wallet-staking')).toBe(true);
    });

    it('returns false for unrelated route', () => {
        expect(shouldFetchCountryCode('suite-index')).toBe(false);
        expect(shouldFetchCountryCode('wallet-index')).toBe(false);
        expect(shouldFetchCountryCode('wallet-tokens')).toBe(false);
    });
});
