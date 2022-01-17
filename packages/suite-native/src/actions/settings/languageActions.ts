/* eslint-disable global-require */

import { SUITE } from '@suite-actions/constants';
import type { Locale } from '@suite-config/languages';

export const fetchLocale = (locale: Locale) => ({
    type: SUITE.SET_LANGUAGE,
    locale,
});
