/* eslint-disable global-require */
import { Dispatch } from '@suite/types';
import * as SUITE from '@suite/actions/constants/suite';

// TODO: it is the same code as for native. Couldn't we just somehow import it from suite-native?
export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    const messages: { [key: string]: any } = {
        en: require('../locales/en'),
        bn: require('../locales/bn'),
        cs: require('../locales/cs'),
        de: require('../locales/de'),
        el: require('../locales/el'),
        es: require('../locales/es'),
        fr: require('../locales/fr'),
        id: require('../locales/id'),
        it: require('../locales/it'),
        ja: require('../locales/ja'),
        nl: require('../locales/nl'),
        pl: require('../locales/pl'),
        pt: require('../locales/pt'),
        ru: require('../locales/ru'),
        uk: require('../locales/uk'),
        zh: require('../locales/zh'),
        'zh-TW': require('../locales/zh-TW'),
    };

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: messages[locale],
    });
};
