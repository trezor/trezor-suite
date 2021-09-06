import { resolveStaticPath } from '@suite-utils/build';
import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';
import type { Locale } from '@suite-config/languages';
import enLocale from '@trezor/suite-data/files/translations/en.json';
import { ensureLocale } from '@suite-utils/l10n';

export const fetchLocale = (locale: Locale) => async (dispatch: Dispatch) => {
    const loc = ensureLocale(locale);
    const localeOverride: { [key: string]: string } =
        loc === 'en'
            ? {}
            : await fetch(resolveStaticPath(`translations/${loc}.json`))
                  .then(res => (res.ok ? res.json() : Promise.reject()))
                  .catch(() => ({}));

    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale: loc,
        messages: { ...enLocale, ...localeOverride },
    });
};
