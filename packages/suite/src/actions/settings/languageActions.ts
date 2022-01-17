import { SUITE } from '@suite-actions/constants';
import { ensureLocale } from '@suite-utils/l10n';
import type { Locale } from '@suite-config/languages';

export const fetchLocale = (locale: Locale) => ({
    type: SUITE.SET_LANGUAGE,
    locale: ensureLocale(locale),
});
