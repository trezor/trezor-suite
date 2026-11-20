import { type CountryCode } from '@suite-common/geolocation';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { selectIsRegionRestrictedByCountry } from './regionsSelectors';

const domain = Feature.regions.presenceRestriction;

describe(selectIsRegionRestrictedByCountry.name, () => {
    it.each([
        ['not restricted: no regions entry', undefined, undefined, 'AU', false],
        ['not restricted: flag off', false, { countries: ['AU'] }, 'AU', false],
        ['not restricted: flag on without payload', true, undefined, 'AU', false],
        ['not restricted: flag on with empty countries', true, { countries: [] }, 'AU', false],
        [
            'not restricted: flag on with only invalid countries',
            true,
            { countries: ['ZZ', 1] },
            'AU',
            false,
        ],
        ['not restricted: unknown user country', true, { countries: ['AU'] }, null, false],
        ['not restricted: user country not listed', true, { countries: ['AU'] }, 'CZ', false],
        ['restricted: user country listed', true, { countries: ['CZ', 'AU'] }, 'AU', true],
    ] as const satisfies [
        string,
        boolean | undefined,
        Record<string, unknown> | undefined,
        CountryCode | null,
        boolean,
    ][])('%s', (_description, flag, payload, country, expected) => {
        const state = {
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                flag === undefined ? {} : { [domain]: flag },
                { [domain]: payload },
            ),
        };

        expect(selectIsRegionRestrictedByCountry(state, country)).toBe(expected);
    });
});
