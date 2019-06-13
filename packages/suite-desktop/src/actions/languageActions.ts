/* eslint-disable global-require */
import { Dispatch } from '@suite-types/index';
import * as SUITE from '@suite-actions/constants/suite';

// TODO: it is the same code as for native. Couldn't we just somehow import it from suite-native?
export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    const messages: { [key: string]: any } = {
        en: require('@suite/locales/en'),
        bn: require('@suite/locales/bn'),
        cs: require('@suite/locales/cs'),
        de: require('@suite/locales/de'),
        el: require('@suite/locales/el'),
        es: require('@suite/locales/es'),
        fr: require('@suite/locales/fr'),
        id: require('@suite/locales/id'),
        it: require('@suite/locales/it'),
        ja: require('@suite/locales/ja'),
        nl: require('@suite/locales/nl'),
        pl: require('@suite/locales/pl'),
        pt: require('@suite/locales/pt'),
        ru: require('@suite/locales/ru'),
        uk: require('@suite/locales/uk'),
        zh: require('@suite/locales/zh'),
        'zh-TW': require('@suite/locales/zh-TW'),
    };

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: messages[locale],
    });
};
