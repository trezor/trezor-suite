import { SUITE } from 'src/actions/suite/constants';
import { ensureLocale } from 'src/utils/suite/l10n';
import type { Locale } from 'src/config/suite/languages';
import type { SuiteAction } from 'src/actions/suite/suiteActions';

export const setLanguage = (locale: Locale): SuiteAction => ({
    type: SUITE.SET_LANGUAGE,
    locale: ensureLocale(locale),
});
