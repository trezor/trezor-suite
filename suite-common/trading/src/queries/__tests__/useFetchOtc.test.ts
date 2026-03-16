import { type TradingOTC } from '../../types';
import { getOtcProvidersByCountry } from '../useFetchOtc';

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
});
