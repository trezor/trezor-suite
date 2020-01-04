/* eslint-disable global-require */
import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';

// TODO: it is the same code as for native. Couldn't we just somehow import it from suite-native?
export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    const messages: { [key: string]: any } = {
        en: require('@suite/locales/en'),
        cs: require('@suite/locales/cs'),
        de: require('@suite/locales/de'),
        es: require('@suite/locales/es'),
        fr: require('@suite/locales/fr'),
        ru: require('@suite/locales/ru'),
    };

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: messages[locale],
    });
};
