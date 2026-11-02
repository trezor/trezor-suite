import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type AppLocaleOption, type LocaleCode, localeInitialState } from '@suite-native/intl';

import { selectIsFinpromRestricted } from './finpromSelectors';

describe(selectIsFinpromRestricted.name, () => {
    it.each([
        ['restricted: in-app Czech with CZ listed', 'cs-CZ', 'en-US', ['CZ'], true],
        ['not restricted: in-app English with CZ listed', 'en-US', 'cs-CZ', ['CZ'], false],
        ['restricted: system Czech with CZ listed', 'system', 'cs-CZ', ['CZ'], true],
        [
            'not restricted: system en-GB resolves to en-US app language with GB listed',
            'system',
            'en-GB',
            ['GB'],
            false,
        ],
    ] as const satisfies [string, AppLocaleOption, LocaleCode, readonly string[], boolean][])(
        '%s',
        (_description, appLocaleCode, systemLocaleCode, countries, expected) => {
            const state = {
                messageSystem: mockMessageSystemStateWithFeatureFlags(
                    { [Feature.finprom.presenceRestriction]: true },
                    { [Feature.finprom.presenceRestriction]: { countries } },
                ),
                locale: { ...localeInitialState, appLocaleCode, systemLocaleCode },
            };

            expect(selectIsFinpromRestricted(state)).toBe(expected);
        },
    );
});
