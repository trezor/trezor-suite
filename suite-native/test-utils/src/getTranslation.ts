import { createIntl, createIntlCache } from 'react-intl';

import { TxKeyPath } from '@suite-native/intl';
import messages from '@suite-native/intl/translations/en-US.json';

const intlEn = createIntl({ locale: 'en', messages }, createIntlCache());

/**
 * Get the translated string for a given translation ID. Use with React Testing Library queries
 * to make tests resilient to translation changes during Crowdin syncs.
 *
 * @param translationId - The react-intl message ID
 * @param values - Optional ICU values for interpolation (e.g., { count, name })
 * @returns The translated string from en-US.json with interpolated values
 * @throws Error if translation ID is not found
 *
 * @example
 * // With getByText
 * expect(screen.getByText(getTranslation('generic.buttons.cancel'))).toBeTruthy();
 *
 * @example
 * // With interpolation
 * expect(screen.getByText(getTranslation('generic.sending.count', { count: 5 }))).toBeTruthy();
 *
 * @example
 * // With regex matcher for flexible matching
 * expect(screen.getByAccessibilityHint('status')).toHaveTextContent(
 *   new RegExp(getTranslation('moduleTrading.tradeHistory.status.success'))
 * );
 *
 * @example
 * // With queryByText for optional elements
 * expect(screen.queryByText(getTranslation('generic.buttons.cancel'))).toBeNull();
 */
export const getTranslation = (
    translationId: TxKeyPath,
    values?: Record<string, string | number>,
): string => {
    const template = messages[translationId as keyof typeof messages];

    if (template === undefined) {
        throw new Error(`Translation ID "${translationId}" not found in en-US.json!`);
    }

    // Throw an error if translation expects a value that was not provided.
    const placeholderRegex = /\{(\w+)(?:,\s*\w+[^}]*)?\}/g;
    const matches = template.matchAll(placeholderRegex);
    const placeholders = Array.from(new Set(Array.from(matches, m => m[1])));

    if (placeholders.length > 0) {
        const providedKeys = values ? Object.keys(values) : [];
        const missingValues = placeholders.filter(
            placeholder => !providedKeys.includes(placeholder),
        );

        if (missingValues.length > 0) {
            throw new Error(
                `Translation "${translationId}" expects value "${missingValues[0]}" but it was not provided. ` +
                    `Translation text: "${template}"`,
            );
        }
    }

    return values && Object.keys(values).length > 0
        ? String(intlEn.formatMessage({ id: translationId, defaultMessage: template }, values))
        : template;
};
