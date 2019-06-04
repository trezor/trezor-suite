import { Dispatch } from '@suite/types';
import * as SUITE from './constants/suite';

// TODO
export const fetchLocale = (locale: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SUITE.SET_LANGUAGE,
        locale,
        messages: {},
    });
};
