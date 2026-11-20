import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type AppLocaleOption, type LocaleCode, localeInitialState } from '@suite-native/intl';

import { selectIsRegionRestricted } from './regionsSelectors';

describe(selectIsRegionRestricted.name, () => {
    it.each([
        ['restricted: in-app Czech with CZ listed', 'cs-CZ', 'en-US', ['CZ'], true],
        ['not restricted: in-app English with CZ listed', 'en-US', 'cs-CZ', ['CZ'], false],
        ['restricted: system Czech with CZ listed', 'system', 'cs-CZ', ['CZ'], true],
        [
            'not restricted: system en-AU resolves to en-US app language with AU listed',
            'system',
            'en-AU',
            ['AU'],
            false,
        ],
    ] as const satisfies [string, AppLocaleOption, LocaleCode, readonly string[], boolean][])(
        '%s',
        (_description, appLocaleCode, systemLocaleCode, countries, expected) => {
            const state = {
                messageSystem: mockMessageSystemStateWithFeatureFlags(
                    { [Feature.regions.presenceRestriction]: true },
                    { [Feature.regions.presenceRestriction]: { countries } },
                ),
                locale: { ...localeInitialState, appLocaleCode, systemLocaleCode },
            };

            expect(selectIsRegionRestricted(state)).toBe(expected);
        },
    );
});
