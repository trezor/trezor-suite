import { type IntlShape, createIntl, createIntlCache } from 'react-intl';

import { getMessagesForLocale } from './translationsMap';
import { type SupportedLocaleCode, type TxKeyPath } from './types';

const intlByLocale = new Map<SupportedLocaleCode, IntlShape>();

const getIntlForLocale = (locale: SupportedLocaleCode): IntlShape => {
    const cachedIntl = intlByLocale.get(locale);

    if (cachedIntl) {
        return cachedIntl;
    }

    const intl = createIntl({ locale, messages: getMessagesForLocale(locale) }, createIntlCache());
    intlByLocale.set(locale, intl);

    return intl;
};

/**
 * Imperative counterpart of the `useTranslate` hook, for code that runs outside of React and
 * therefore cannot use it, e.g. Redux thunks passing strings to native OS prompts.
 *
 * The locale has to be resolved by the caller, typically via `selectSupportedLanguageLocale`.
 * Prefer `useTranslate` or the `Translation` component whenever React context is available.
 */
export const getLocalizedMessage = (
    locale: SupportedLocaleCode,
    id: TxKeyPath,
    values?: Record<string, string | number>,
): string => String(getIntlForLocale(locale).formatMessage({ id }, values));
