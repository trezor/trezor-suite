/* eslint-disable global-require */

import { SUITE } from '@suite-actions/constants';
import type { Locale } from '@suite-config/languages';
import type { SuiteAction } from '@suite-actions/suiteActions';

export const setLanguage = (locale: Locale): SuiteAction => ({
    type: SUITE.SET_LANGUAGE,
    locale,
});
