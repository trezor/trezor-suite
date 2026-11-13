import { type DevicePresenceSignals } from '@suite-common/geolocation';

import {
    buildDesktopDeviceSignals,
    buildNativeDeviceSignals,
    buildWebDeviceSignals,
    getLanguageRegion,
} from './deviceSignals';

type Regions = Omit<DevicePresenceSignals, 'timeZone'>;

describe(getLanguageRegion.name, () => {
    it.each([
        ['en-AU', 'AU'],
        ['cs', null],
        ['x-invalid-@@', null],
        ['en_GB.UTF-8', 'GB'],
        ['de_AT@euro', 'AT'],
        ['C', null],
    ] as const)('returns the region of %s', (tag, expected) => {
        expect(getLanguageRegion(tag)).toBe(expected);
    });
});

describe(buildWebDeviceSignals.name, () => {
    it.each([
        [
            'region of the first language',
            ['en-AU'],
            'Australia/Sydney',
            { primaryRegion: 'AU', secondaryRegions: [] },
        ],
        [
            'later languages after default English',
            ['en-US', 'cs-CZ'],
            'Europe/Prague',
            { primaryRegion: null, secondaryRegions: ['CZ'] },
        ],
        [
            'default English with a non-geographic time zone',
            ['en-US'],
            'Etc/UTC',
            { primaryRegion: null, secondaryRegions: [] },
        ],
        [
            'later languages without a time zone',
            ['en', 'de-DE'],
            null,
            { primaryRegion: null, secondaryRegions: ['DE'] },
        ],
        [
            'default English in any case',
            ['EN-us', 'de-DE'],
            'Europe/Berlin',
            { primaryRegion: null, secondaryRegions: ['DE'] },
        ],
        [
            'language without a region',
            ['cs'],
            'Europe/Prague',
            { primaryRegion: null, secondaryRegions: [] },
        ],
        [
            'invalid language tag',
            ['x-invalid-@@'],
            'Europe/Prague',
            { primaryRegion: null, secondaryRegions: [] },
        ],
    ] as const satisfies [string, readonly string[], string | null, Regions][])(
        'resolves %s',
        (_description, languages, timeZone, expected) => {
            expect(buildWebDeviceSignals({ timeZone, languages })).toEqual({
                timeZone,
                ...expected,
            });
        },
    );

    it.each([
        ['privacy browser', ['en-US', 'en'], { primaryRegion: null, secondaryRegions: [] }],
        ['localized privacy browser', ['cs-CZ'], { primaryRegion: 'CZ', secondaryRegions: [] }],
    ] as const satisfies [string, readonly string[], Regions][])(
        'ignores the spoofed resistFingerprinting time zone in a %s',
        (_description, languages, expected) => {
            expect(buildWebDeviceSignals({ timeZone: 'Atlantic/Reykjavik', languages })).toEqual({
                timeZone: null,
                ...expected,
            });
        },
    );

    it('maps an empty time zone to null', () => {
        expect(buildWebDeviceSignals({ timeZone: '', languages: ['en-AU'] }).timeZone).toBeNull();
    });
});

describe(buildDesktopDeviceSignals.name, () => {
    it.each([
        [
            'the OS region',
            { regionCode: 'au', preferredLanguages: ['de-DE'] },
            { primaryRegion: 'AU', secondaryRegions: [] },
        ],
        [
            'preferred languages without the OS region',
            { regionCode: null, preferredLanguages: ['en-AU', 'de-DE', 'de-AT', 'en-AU'] },
            { primaryRegion: null, secondaryRegions: ['AU', 'DE', 'AT'] },
        ],
        [
            'an unknown OS region',
            { regionCode: 'ZZ', preferredLanguages: [] },
            { primaryRegion: null, secondaryRegions: [] },
        ],
    ] as const satisfies [
        string,
        { regionCode: string | null; preferredLanguages: readonly string[] },
        Regions,
    ][])('resolves %s', (_description, locale, expected) => {
        expect(buildDesktopDeviceSignals({ timeZone: 'Australia/Sydney', locale })).toEqual({
            timeZone: 'Australia/Sydney',
            ...expected,
        });
    });
});

describe(buildNativeDeviceSignals.name, () => {
    it.each([
        [
            'the first locale region',
            [{ regionCode: 'AU' }, { regionCode: 'CZ' }],
            { primaryRegion: 'AU', secondaryRegions: [] },
        ],
        [
            'later locale regions without the first one',
            [{ regionCode: null }, { regionCode: 'CZ' }],
            { primaryRegion: null, secondaryRegions: ['CZ'] },
        ],
    ] as const satisfies [string, readonly { regionCode: string | null }[], Regions][])(
        'resolves %s',
        (_description, locales, expected) => {
            expect(buildNativeDeviceSignals({ timeZone: 'Australia/Sydney', locales })).toEqual({
                timeZone: 'Australia/Sydney',
                ...expected,
            });
        },
    );
});
