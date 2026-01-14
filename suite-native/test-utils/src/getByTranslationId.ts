import { screen } from '@testing-library/react-native';

import { TxKeyPath } from '@suite-native/intl';
import messages from '@suite-native/intl/translations/en-US.json';

/**
 * Find an element by its translation ID. This is a wrapper around screen.getByText that
 * automatically looks up the translated text from the translation ID.
 * Prefer using this util over plain getByText because strings may change with a Crowdin update and break tests.
 *
 * @param translationId - The react-intl message ID (e.g., 'moduleHome.emptyState.connectTrezor.description')
 * @returns The React element matching the translated text
 *
 * @example
 * expect(getByTranslationId('generic.buttons.cancel')).toBeTruthy();
 */
export const getByTranslationId = (translationId: TxKeyPath) => {
    const translation = messages[translationId as keyof typeof messages];

    if (translation === undefined) {
        throw new Error(`Translation ID "${translationId}" not found in en-US.json!`);
    }

    return screen.getByText(translation);
};
