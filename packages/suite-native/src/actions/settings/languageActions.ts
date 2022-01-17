/* eslint-disable global-require */

import { SUITE } from '@suite-actions/constants';
import type { Locale } from '@suite-config/languages';

export const setLanguage = (locale: Locale) => ({
    type: SUITE.SET_LANGUAGE,
    locale,
});
