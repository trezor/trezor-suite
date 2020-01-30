// Not used at the moment but might be in future. Keeping it here for some more time.

import { ONBOARDING } from '@onboarding-actions/constants';

import { MAILCHIMP_U, MAILCHIMP_ID, MAILCHIMP_BASE } from '@onboarding-config/mailchimp';
import { Dispatch, GetState } from '@suite-types';
import { Checkbox } from '@onboarding-types';

const GET = 'GET';
const MODE_NO_CORS: 'no-cors' = 'no-cors';

export type NewsletterActionTypes =
    | {
          type: typeof ONBOARDING.TOGGLE_CHECKBOX;
          checkbox: string;
      }
    | {
          type: typeof ONBOARDING.SET_EMAIL;
          email: string;
      }
    | {
          type: typeof ONBOARDING.SET_SKIPPED;
          skipped: boolean;
      }
    | {
          type: typeof ONBOARDING.FETCH_START;
      }
    | {
          type: typeof ONBOARDING.FETCH_SUCCESS;
      }
    | {
          type: typeof ONBOARDING.FETCH_ERROR;
          error: string;
      };

const toggleCheckbox = (checkbox: string) => ({
    type: ONBOARDING.TOGGLE_CHECKBOX,
    checkbox,
});

const setEmail = (email: string) => ({
    type: ONBOARDING.SET_EMAIL,
    email,
});

const setSkipped = () => ({
    type: ONBOARDING.SET_SKIPPED,
});

const submitEmail = () => async (dispatch: Dispatch, getState: GetState) => {
    // @ts-ignore
    const { email, checkboxes } = getState().onboarding.newsletter;
    let url = `${MAILCHIMP_BASE}/subscribe/post-json?u=${MAILCHIMP_U}&id=${MAILCHIMP_ID}&group[1][1]=true&group[5][8]=true`;
    checkboxes.forEach((checkbox: Checkbox, index: number) => {
        if (checkbox.value) {
            url += `&group[21][${2 ** (index + 5)}]=true`;
        }
    });
    url += `&EMAIL=${email}`;
    dispatch({ type: ONBOARDING.FETCH_START });
    try {
        const response = await fetch(url, { method: GET, mode: MODE_NO_CORS });
        // response.status === 0 is cors-hack, cors doesnt allow us to read response status,
        // mailchimp api cant be used as well as it does not support CORS
        if (response.ok || response.status === 0) {
            dispatch({ type: ONBOARDING.FETCH_SUCCESS });
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        dispatch({ type: ONBOARDING.FETCH_ERROR, error: error.message });
    }
};

export { toggleCheckbox, setEmail, submitEmail, setSkipped };
