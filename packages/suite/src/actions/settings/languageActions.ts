import { resolveStaticPath } from '@suite-utils/build';
import { SUITE } from '@suite-actions/constants';
import { Dispatch } from '@suite-types';
import { LANGUAGES } from '@suite-config';
import enLocale from '@trezor/suite-data/files/translations/en.json';

export const fetchLocale = (locale: typeof LANGUAGES[number]['code']) => async (
    dispatch: Dispatch,
) => {
    if (locale === 'en') {
        dispatch({
            type: SUITE.SET_LANGUAGE,
            locale,
            messages: enLocale,
        });
    } else {
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
                messages: enLocale,
            });
        }
    }
};
