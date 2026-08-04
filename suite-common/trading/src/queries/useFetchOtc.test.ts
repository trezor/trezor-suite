import { getOtcProvidersByCountry } from './useFetchOtc';
import { type TradingOTC } from '../types';

describe('getOtcProvidersByCountry', () => {
    const otcData: TradingOTC = {
        country: 'CZ',
        minFiatLimits: {} as TradingOTC['minFiatLimits'],
        links: [
            {
                name: 'Provider CZ',
                url: 'https://provider-cz.example',
                allowedCountries: ['CZ', 'SK'],
            },
            {
                name: 'Provider DE',
                url: 'https://provider-de.example',
                allowedCountries: ['DE'],
            },
        ],
    };

    it('should return providers allowed for selected country', () => {
        const result = getOtcProvidersByCountry(otcData, 'CZ');

        expect(result).toEqual([
            expect.objectContaining({
                name: 'Provider CZ',
            }),
        ]);
    });

    it('should return stable empty array when no provider is allowed for selected country', () => {
        const firstResult = getOtcProvidersByCountry(otcData, 'US');
        const secondResult = getOtcProvidersByCountry(otcData, 'US');

        expect(firstResult).toEqual([]);
        expect(firstResult).toBe(secondResult);
    });

    it('should return stable empty array when otc data are undefined', () => {
        const firstResult = getOtcProvidersByCountry(undefined, 'CZ');
        const secondResult = getOtcProvidersByCountry(undefined, 'CZ');

        expect(firstResult).toEqual([]);
        expect(firstResult).toBe(secondResult);
    });

    it('should not throw when links is a non-array (poison record from untrusted trade server)', () => {
        const poisonData = { ...otcData, links: 'not-an-array' } as unknown as TradingOTC;

        expect(() => getOtcProvidersByCountry(poisonData, 'CZ')).not.toThrow();
        expect(getOtcProvidersByCountry(poisonData, 'CZ')).toEqual([]);
    });

    it('should not throw when a link has non-array allowedCountries (poison record)', () => {
        const poisonData = {
            ...otcData,
            links: [
                { name: 'Poison', url: 'https://poison.example', allowedCountries: 'CZ' },
                {
                    name: 'Provider CZ',
                    url: 'https://provider-cz.example',
                    allowedCountries: ['CZ'],
                },
            ],
        } as unknown as TradingOTC;

        expect(() => getOtcProvidersByCountry(poisonData, 'CZ')).not.toThrow();
        expect(getOtcProvidersByCountry(poisonData, 'CZ')).toEqual([
            expect.objectContaining({ name: 'Provider CZ' }),
        ]);
    });
});
