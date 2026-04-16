import { createIntl, createIntlCache } from 'react-intl';

import { messages } from './messages';
import { type TxKeyPath } from './types';
import { flatten } from './utils';

const intlEn = createIntl({ locale: 'en', messages: flatten(messages) }, createIntlCache());

const getTemplate = (translationId: TxKeyPath): string => {
    const idPath = translationId.split('.');
    let template: any = messages;

    for (const segment of idPath) {
        template = template[segment];
        if (template === undefined) {
            throw new Error(`Translation ID "${translationId}" not found in messages.ts!`);
        }
    }

    if (typeof template !== 'string') {
        throw new Error(`Translation ID "${translationId}" does not point to a string value!`);
    }

    return template;
};

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
    const template = getTemplate(translationId);

    // Throw an error if translation expects a value that was not provided.
    const placeholderRegex = /\{(\w+)(?:,\s*\w+[^}]*)?}/g;
    const matches = template.matchAll(placeholderRegex);
    const placeholders: string[] = Array.from(matches, m => m[1]).filter(
        (p): p is string => p !== undefined,
    );
    const uniquePlaceholders = Array.from(new Set(placeholders));

    if (uniquePlaceholders.length > 0) {
        const providedKeys = values ? Object.keys(values) : [];
        const missingValues = uniquePlaceholders.filter(
            placeholder => !providedKeys.includes(placeholder),
        );

        if (missingValues.length > 0) {
            const firstMissing = missingValues[0] ?? 'unknown';
            throw new Error(
                `Translation "${translationId}" expects value "${firstMissing}" but it was not provided. ` +
                    `Translation text: "${template}"`,
            );
        }
    }

    return values && Object.keys(values).length > 0
        ? String(intlEn.formatMessage({ id: translationId, defaultMessage: template }, values))
        : template;
};
