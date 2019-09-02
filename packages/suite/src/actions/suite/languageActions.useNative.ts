import { resolveStaticPath } from '@suite-utils/nextjs';
import { SUITE } from './constants';
import { Dispatch } from '@suite-types';

export const fetchLocale = (locale: string) => async (dispatch: Dispatch) => {
    try {
        const response = await fetch(resolveStaticPath(`translations/l10n/${locale}.json`));
        if (!response.ok) throw Error(response.statusText);
        const messages: { [key: string]: string } = await response.json();
        dispatch({
            type: SUITE.SET_LANGUAGE,
            locale,
            messages,
        });
    } catch (error) {
        console.error('fetchLocale', error);
    }
};
