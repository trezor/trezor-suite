import { resolveStaticPath } from '@suite-utils/build';
import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';
import type { Locale } from '@suite-config/languages';
import enLocale from '@trezor/suite-data/files/translations/en.json';

export const fetchLocale = (locale: Locale) => async (dispatch: Dispatch) => {
    const localeOverride: { [key: string]: string } =
        locale === 'en'
            ? {}
            : await fetch(resolveStaticPath(`translations/${locale}.json`))
                  .then(res => (res.ok ? res.json() : Promise.reject()))
                  .catch(() => ({}));

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: { ...enLocale, ...localeOverride },
    });
};
