/* eslint-disable global-require */

import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';
import type { Locale } from '@suite-config/languages';

// TODO: copy files from suite-data and then require from this package just to be consistent?
export const fetchLocale = (locale: Locale) => (dispatch: Dispatch) => {
    const messages: { [key: string]: any } = {
        en: require('@trezor/suite-data/files/translations/en'),
        // cs: require('@trezor/suite-data/files/translations/cs'),
        // de: require('@trezor/suite-data/files/translations/de'),
        // es: require('@trezor/suite-data/files/translations/es'),
        // fr: require('@trezor/suite-data/files/translations/fr'),
        // ru: require('@trezor/suite-data/files/translations/ru'),
    };

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: messages[locale],
    });
};
