import type { Locale } from '@suite-common/suite-types';

import { SUITE } from 'src/actions/suite/constants';
import type { SuiteAction } from 'src/actions/suite/suiteActions';
import { ensureLocale } from 'src/utils/suite/l10n';

export const setLanguage = (locale: Locale): SuiteAction => ({
    type: SUITE.SET_LANGUAGE,
    locale: ensureLocale(locale),
});
