import { resolveStaticPath } from '@suite-utils/nextjs';
import { SUITE } from './constants';
import { Dispatch } from '@suite-types';

export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    fetch(resolveStaticPath(`@trezor/suite-data/files/l10n/${locale}.json`))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw Error(response.statusText);
        })
        .then(messages => {
            dispatch({
                type: SUITE.SET_LANGUAGE,
                locale,
                messages,
            });
        })
        .catch(error => {
            // eslint-disable-next-line no-console
            console.error(error);
        });
};
