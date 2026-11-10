import { timezoneCountries } from './timezoneCountries';

describe('timezoneCountries', () => {
    it.each([
        ['Europe/London', 'GB'],
        ['Europe/Belfast', 'GB'],
        ['GB-Eire', 'GB'],
        ['Europe/Jersey', 'JE'],
        ['Europe/Prague', 'CZ'],
        ['America/New_York', 'US'],
    ] as const)('maps %s to %s', (timeZone, country) => {
        expect(timezoneCountries[timeZone]).toBe(country);
    });

    it.each(['UTC', 'Etc/UTC', 'GMT'])('does not map non-geographic zone %s', timeZone => {
        expect(Object.hasOwn(timezoneCountries, timeZone)).toBe(false);
    });
});
