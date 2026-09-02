import Localization, { type Locale } from 'expo-localization';

import { getPreferredCountryOption } from './getPreferredCountryOption';

describe('getPreferredCountryOption()', () => {
    it('should use value from expo-localization when country is not set in store', () => {
        expect(getPreferredCountryOption()).toEqual(
            expect.objectContaining({
                value: 'PL',
            }),
        );
    });

    it('should fallback to worldwide when country is not set in store and expo-localization country is not supported', () => {
        jest.spyOn(Localization, 'getLocales').mockReturnValue([
            {
                languageTag: 'es-CU',
                languageCode: 'es',
                textDirection: 'ltr',
                digitGroupingSeparator: ' ',
                decimalSeparator: ',',
                measurementSystem: 'metric',
                currencyCode: 'CUP',
                currencySymbol: '$',
                regionCode: 'CU',
                temperatureUnit: 'celsius',
            } as unknown as Locale,
        ]);

        expect(getPreferredCountryOption()).toEqual(
            expect.objectContaining({
                value: 'unknown',
            }),
        );
    });
});
