// TODO: deprecated, rework to separate actions;

import { FETCH_START, FETCH_ERROR, FETCH_SUCCESS } from '@suite/types/onboarding/fetch';
import { SUBMIT_EMAIL } from '@suite/actions/onboarding/constants/fetchCalls';
import { Dispatch } from '@suite-types';

const GET = 'GET';
const MODE_NO_CORS: 'no-cors' = 'no-cors';

const getParams = (name: string) => {
    switch (name) {
        case SUBMIT_EMAIL:
            return { options: { method: GET, mode: MODE_NO_CORS } };
        default:
            throw new Error(`fetchCall ${name} is not defined`);
    }
};

const fetchResource = (name: string, url: string) => async (dispatch: Dispatch) => {
    dispatch({ type: FETCH_START, name });
    try {
        const params = getParams(name);
        const response = await fetch(url, params.options);
        // response.status === 0 is cors-hack, cors doesnt allow us to read response status,
        // mailchimp api cant be used as well as it does not support CORS
        if (response.ok || response.status === 0) {
            dispatch({ type: FETCH_SUCCESS, result: response });
        } else {
            dispatch({ type: FETCH_ERROR, error: response.statusText });
        }
        return response;
    } catch (error) {
        dispatch({ type: FETCH_ERROR, error });
        return error;
    }
};

export {
    // abstract action
    fetchResource,
};
