import { type CountryCode } from '@suite-common/geolocation';

import { getPlaceholderCountryFromLocale } from './placeholderPresence';

describe(getPlaceholderCountryFromLocale.name, () => {
    it.each([
        ['cs-CZ', 'CZ'],
        ['en-US', 'US'],
        ['zh-TW', 'TW'],
        ['en', null],
        ['', null],
        ['en-ZZ', null],
        ['en-gb', 'GB'],
    ] as const satisfies [string, CountryCode | null][])('%s → %s', (locale, expected) => {
        expect(getPlaceholderCountryFromLocale(locale)).toBe(expected);
    });
});
