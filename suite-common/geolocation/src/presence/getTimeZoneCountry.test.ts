import { getTimeZoneCountry } from './getTimeZoneCountry';

describe(getTimeZoneCountry.name, () => {
    it.each([
        ['Australia/Sydney', 'AU'],
        ['Australia/ACT', 'AU'],
        ['Australia/Canberra', 'AU'],
        ['Indian/Christmas', 'CX'],
        ['Europe/Prague', 'CZ'],
        ['America/New_York', 'US'],
        ['Iceland', 'IS'],
        ['Africa/Asmera', 'ER'],
        ['America/Virgin', 'VI'],
        ['Pacific/Truk', 'FM'],
        ['Africa/Timbuktu', 'ML'],
        ['Atlantic/Jan_Mayen', 'SJ'],
    ] as const)('maps %s to %s', (timeZone, country) => {
        expect(getTimeZoneCountry(timeZone)).toBe(country);
    });

    it.each([
        'UTC',
        'Etc/UTC',
        'GMT',
        'CET',
        'CST6CDT',
        'EET',
        'EST',
        'EST5EDT',
        'HST',
        'MET',
        'MST',
        'MST7MDT',
        'PST8PDT',
        'WET',
    ])('does not map non-geographic zone %s', timeZone => {
        expect(getTimeZoneCountry(timeZone)).toBeUndefined();
    });

    it.each([null, '', 'Mars/Olympus_Mons', 'toString', '__proto__'])(
        'does not map %j',
        timeZone => {
            expect(getTimeZoneCountry(timeZone)).toBeUndefined();
        },
    );
});
