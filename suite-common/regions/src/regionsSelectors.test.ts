import {
    type GeolocationState,
    type PresenceSignals,
    estimatePresence,
    geolocationInitialState,
} from '@suite-common/geolocation';
import { mockGeolocationStateInCountry } from '@suite-common/geolocation/mocks';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { selectIsRegionRestricted, selectIsRegionRestrictedBySignals } from './regionsSelectors';

jest.mock('@suite-common/geolocation', () => ({
    ...jest.requireActual('@suite-common/geolocation'),
    estimatePresence: jest.fn(jest.requireActual('@suite-common/geolocation').estimatePresence),
}));

const domain = Feature.regions.presenceRestriction;

const createState = (flag: boolean | undefined, payload?: Record<string, unknown>) => ({
    messageSystem: mockMessageSystemStateWithFeatureFlags(
        flag === undefined ? {} : { [domain]: flag },
        { [domain]: payload },
    ),
});

describe(selectIsRegionRestrictedBySignals.name, () => {
    const signalsIn = (ipCountry: string | null, region: string | null): PresenceSignals => ({
        ipCountry,
        timeZone: 'Australia/Sydney',
        primaryRegion: region,
        secondaryRegions: [],
    });

    const strongAu = signalsIn('AU', 'AU');

    beforeEach(() => {
        jest.mocked(estimatePresence).mockClear();
    });

    it.each([
        ['no regions entry', undefined, undefined],
        ['flag off', false, { countries: ['AU'] }],
        ['flag on without payload', true, undefined],
        ['flag on with empty countries', true, { countries: [] }],
        ['flag on with only invalid countries', true, { countries: ['ZZ', 1] }],
    ] as const satisfies [string, boolean | undefined, Record<string, unknown> | undefined][])(
        'is not restricted without a usable config: %s',
        (_description, flag, payload) => {
            expect(selectIsRegionRestrictedBySignals(createState(flag, payload), strongAu)).toBe(
                false,
            );
            expect(estimatePresence).not.toHaveBeenCalled();
        },
    );

    it.each([
        ['strong presence in a listed country', strongAu, undefined, true],
        ['weak presence above the default threshold', signalsIn('CZ', 'AU'), undefined, true],
        ['weak presence below a configured threshold', signalsIn('CZ', 'AU'), { weak: 0.6 }, false],
        [
            'weak presence with an invalid configured threshold',
            signalsIn('CZ', 'AU'),
            { weak: 1.1 },
            true,
        ],
        ['weak presence below the default threshold', signalsIn('DE', 'DE'), undefined, false],
        [
            'no presence evidence',
            { ipCountry: null, timeZone: null, primaryRegion: null, secondaryRegions: [] },
            undefined,
            false,
        ],
    ] as const satisfies [string, PresenceSignals, Record<string, unknown> | undefined, boolean][])(
        '%s',
        (_description, signals, thresholds, expected) => {
            const state = createState(true, { countries: ['AU'], thresholds });

            expect(selectIsRegionRestrictedBySignals(state, signals)).toBe(expected);
        },
    );
});

describe(selectIsRegionRestricted.name, () => {
    it.each([
        ['restricted: present in a listed country', mockGeolocationStateInCountry('AU'), true],
        [
            'restricted: IP in a listed country outweighs device signals',
            {
                ...geolocationInitialState,
                countryCode: 'AU',
                countryCodeFetch: { status: 'success', timestamp: 0 },
                deviceSignals: {
                    timeZone: 'Europe/Prague',
                    primaryRegion: 'CZ',
                    secondaryRegions: [],
                },
            },
            true,
        ],
        ['not restricted: no signals', geolocationInitialState, false],
    ] as const satisfies [string, GeolocationState, boolean][])(
        '%s',
        (_description, geolocation, expected) => {
            const state = {
                ...createState(true, { countries: ['AU'] }),
                geolocation,
            };

            expect(selectIsRegionRestricted(state)).toBe(expected);
        },
    );
});
