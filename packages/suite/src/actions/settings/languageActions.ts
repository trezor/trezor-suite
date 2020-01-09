import { resolveStaticPath } from '@suite-utils/nextjs';
import { SUITE } from '@suite-constants';
import { Dispatch } from '@suite-types';
import { LANGUAGES } from '@suite-config';

export const fetchLocale = (locale: typeof LANGUAGES[number]['code']) => async (
    dispatch: Dispatch,
) => {
    try {
        const response = await fetch(resolveStaticPath(`translations/${locale}.json`));
        if (!response.ok) throw Error(response.statusText);
        const messages: { [key: string]: string } = await response.json();
        dispatch({
            type: SUITE.SET_LANGUAGE,
            locale,
            messages,
        });
    } catch (error) {
        dispatch({
            type: SUITE.SET_LANGUAGE,
            locale: 'en',
            messages: {},
        });
    }
};
