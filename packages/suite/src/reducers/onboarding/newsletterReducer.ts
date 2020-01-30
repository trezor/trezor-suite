// todo: not used at the moment but might be in future. Keeping it here for some more time

import produce from 'immer';

import { ONBOARDING } from '@onboarding-actions/constants';
import { Action } from '@suite-types';
import { Checkbox } from '@onboarding-types';

interface NewsletterState {
    email: string;
    skipped: boolean;
    checkboxes: Checkbox[];
    isProgress: boolean;
    isSuccess: boolean;
    error: null | string;
}

const initialState: NewsletterState = {
    email: '',
    skipped: false,
    // note that order of elements in array is important, it defines how mailchimp understands subscription;
    checkboxes: [
        {
            value: true,
            label: 'Security updates',
        },
        {
            value: true,
            label: 'Product updates',
        },
        {
            value: true,
            label: 'Special offers',
        },
        {
            value: true,
            label: 'Educational content',
        },
        {
            value: true,
            label: 'Tech & Dev corner',
        },
    ],
    isSuccess: false,
    isProgress: false,
    error: null,
};

const newsletter = (state: NewsletterState = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case ONBOARDING.TOGGLE_CHECKBOX:
                draft.checkboxes = draft.checkboxes.map(checkbox => {
                    const toggled = checkbox;
                    if (checkbox.label === action.checkbox) {
                        toggled.value = !checkbox.value;
                    }
                    return toggled;
                });
                break;
            case ONBOARDING.SET_EMAIL:
                draft.email = action.email;
                break;
            case ONBOARDING.SET_SKIPPED:
                draft.skipped = true;
                break;
            case ONBOARDING.FETCH_START:
                draft.isProgress = true;
                break;
            case ONBOARDING.FETCH_SUCCESS:
                draft.isSuccess = true;
                draft.isProgress = false;
                draft.error = null;
                break;
            case ONBOARDING.FETCH_ERROR:
                draft.isProgress = false;
                draft.isSuccess = false;
                draft.error = action.error;
                break;
            default:
            // no default
        }
    });
};

export default newsletter;
