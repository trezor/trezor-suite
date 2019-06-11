import { Dispatch } from '@suite-types/index';
import * as SUITE from './constants/suite';

export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    fetch(`/static/l10n/${locale}.json`)
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
