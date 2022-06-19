import { SUITE } from '@suite-actions/constants';
import { ensureLocale, Locale } from '@suite/intl';
import type { SuiteAction } from '@suite-actions/suiteActions';

export const setLanguage = (locale: Locale): SuiteAction => ({
    type: SUITE.SET_LANGUAGE,
    locale: ensureLocale(locale),
});
