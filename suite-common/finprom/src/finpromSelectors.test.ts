import { type CountryCode } from '@suite-common/geolocation';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { selectIsFinpromRestrictedByCountry } from './finpromSelectors';

const domain = Feature.finprom.presenceRestriction;

describe(selectIsFinpromRestrictedByCountry.name, () => {
    it.each([
        ['not restricted: no finprom entry', undefined, undefined, 'GB', false],
        ['not restricted: flag off', false, { countries: ['GB'] }, 'GB', false],
        ['not restricted: flag on without payload', true, undefined, 'GB', false],
        ['not restricted: flag on with empty countries', true, { countries: [] }, 'GB', false],
        [
            'not restricted: flag on with only invalid countries',
            true,
            { countries: ['ZZ', 1] },
            'GB',
            false,
        ],
        ['not restricted: unknown user country', true, { countries: ['GB'] }, null, false],
        ['not restricted: user country not listed', true, { countries: ['GB'] }, 'CZ', false],
        ['restricted: user country listed', true, { countries: ['CZ', 'GB'] }, 'GB', true],
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

        expect(selectIsFinpromRestrictedByCountry(state, country)).toBe(expected);
    });
});
