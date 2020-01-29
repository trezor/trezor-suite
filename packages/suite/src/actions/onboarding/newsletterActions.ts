// Not used at the moment but might be in future. Keeping it here for some more time.

import {
    TOGGLE_CHECKBOX,
    SET_EMAIL,
    SET_SKIPPED,
    FETCH_ERROR,
    FETCH_START,
    FETCH_SUCCESS,
    Checkbox,
} from '@onboarding-types/newsletter';

import { MAILCHIMP_U, MAILCHIMP_ID, MAILCHIMP_BASE } from '@onboarding-config/mailchimp';
import { Dispatch, GetState } from '@suite-types';

const GET = 'GET';
const MODE_NO_CORS: 'no-cors' = 'no-cors';

const toggleCheckbox = (checkbox: string) => ({
    type: TOGGLE_CHECKBOX,
    checkbox,
});

const setEmail = (email: string) => ({
    type: SET_EMAIL,
    email,
});

const setSkipped = () => ({
    type: SET_SKIPPED,
});

const submitEmail = () => async (dispatch: Dispatch, getState: GetState) => {
    const { email, checkboxes } = getState().onboarding.newsletter;
    let url = `${MAILCHIMP_BASE}/subscribe/post-json?u=${MAILCHIMP_U}&id=${MAILCHIMP_ID}&group[1][1]=true&group[5][8]=true`;
    checkboxes.forEach((checkbox: Checkbox, index: number) => {
        if (checkbox.value) {
            url += `&group[21][${2 ** (index + 5)}]=true`;
        }
    });
    url += `&EMAIL=${email}`;
    dispatch({ type: FETCH_START });
    try {
        const response = await fetch(url, { method: GET, mode: MODE_NO_CORS });
        // response.status === 0 is cors-hack, cors doesnt allow us to read response status,
        // mailchimp api cant be used as well as it does not support CORS
        if (response.ok || response.status === 0) {
            dispatch({ type: FETCH_SUCCESS });
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        dispatch({ type: FETCH_ERROR, error: error.message });
    }
};

export { toggleCheckbox, setEmail, submitEmail, setSkipped };
