import {
    TOGGLE_CHECKBOX,
    SET_EMAIL,
    SET_SKIPPED,
    Checkbox,
} from '@suite/types/onboarding/newsletter';

import { MAILCHIMP_U, MAILCHIMP_ID, MAILCHIMP_BASE } from '@suite/config/onboarding/mailchimp';
import { SUBMIT_EMAIL } from '@suite/actions/onboarding/constants/fetchCalls';

import { fetchResource } from './fetchActions';
import { Dispatch, GetState } from '@suite-types';

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

const submitEmail = () => (dispatch: Dispatch, getState: GetState) => {
    const { email, checkboxes } = getState().onboarding.newsletter;
    let url = `${MAILCHIMP_BASE}/subscribe/post-json?u=${MAILCHIMP_U}&id=${MAILCHIMP_ID}&group[1][1]=true&group[5][8]=true`;
    checkboxes.forEach((checkbox: Checkbox, index: number) => {
        if (checkbox.value) {
            url += `&group[21][${2 ** (index + 5)}]=true`;
        }
    });
    url += `&EMAIL=${email}`;
    dispatch(fetchResource(SUBMIT_EMAIL, url));
};

export { toggleCheckbox, setEmail, submitEmail, setSkipped };
