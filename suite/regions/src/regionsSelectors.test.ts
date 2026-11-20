import { suiteSettingsInitialState } from '@suite/settings';
import { type Locale } from '@suite-common/locale';
import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';

import { selectIsRegionRestricted } from './regionsSelectors';

describe(selectIsRegionRestricted.name, () => {
    it.each([
        ['restricted: Czech language with CZ listed', 'cs-CZ', true],
        ['not restricted: English language with CZ listed', 'en-US', false],
    ] as const satisfies [string, Locale, boolean][])('%s', (_description, language, expected) => {
        const state = {
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                { [Feature.regions.presenceRestriction]: true },
                { [Feature.regions.presenceRestriction]: { countries: ['CZ'] } },
            ),
            suiteSettings: { ...suiteSettingsInitialState, language },
        };

        expect(selectIsRegionRestricted(state)).toBe(expected);
    });
});
