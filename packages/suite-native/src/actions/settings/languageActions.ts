/* eslint-disable global-require */

import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';
import { LANGUAGES } from '@suite-config';

// TODO: copy files from suite-data and then require from this package just to be consistent?
export const fetchLocale = (locale: typeof LANGUAGES[number]['code']) => (dispatch: Dispatch) => {
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
