/* eslint-disable global-require */

import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';

// TODO
export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    const messages: { [key: string]: any } = {
        en: require('@trezor/suite-data/translations/l10n/en'),
        bn: require('@trezor/suite-data/translations/l10n/bn'),
        cs: require('@trezor/suite-data/translations/l10n/cs'),
        de: require('@trezor/suite-data/translations/l10n/de'),
        el: require('@trezor/suite-data/translations/l10n/el'),
        es: require('@trezor/suite-data/translations/l10n/es'),
        fr: require('@trezor/suite-data/translations/l10n/fr'),
        id: require('@trezor/suite-data/translations/l10n/id'),
        it: require('@trezor/suite-data/translations/l10n/it'),
        ja: require('@trezor/suite-data/translations/l10n/ja'),
        nl: require('@trezor/suite-data/translations/l10n/nl'),
        pl: require('@trezor/suite-data/translations/l10n/pl'),
        pt: require('@trezor/suite-data/translations/l10n/pt'),
        ru: require('@trezor/suite-data/translations/l10n/ru'),
        uk: require('@trezor/suite-data/translations/l10n/uk'),
        zh: require('@trezor/suite-data/translations/l10n/zh'),
        'zh-TW': require('@trezor/suite-data/translations/l10n/zh-TW'),
    };

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: messages[locale],
    });
};
