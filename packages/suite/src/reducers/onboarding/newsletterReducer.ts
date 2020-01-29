// todo: not used at the moment but might be in future. Keeping it here for some more time

import produce from 'immer';

import {
    NewsletterState,
    NewsletterActionTypes,
    TOGGLE_CHECKBOX,
    SET_EMAIL,
    SET_SKIPPED,
    FETCH_START,
    FETCH_ERROR,
    FETCH_SUCCESS,
} from '@onboarding-types/newsletter';

const initialState = {
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

const newsletter = (state: NewsletterState = initialState, action: NewsletterActionTypes) => {
    return produce(state, draft => {
        switch (action.type) {
            case TOGGLE_CHECKBOX:
                draft.checkboxes = draft.checkboxes.map(checkbox => {
                    const toggled = checkbox;
                    if (checkbox.label === action.checkbox) {
                        toggled.value = !checkbox.value;
                    }
                    return toggled;
                });
                break;
            case SET_EMAIL:
                draft.email = action.email;
                break;
            case SET_SKIPPED:
                draft.skipped = true;
                break;
            case FETCH_START:
                draft.isProgress = true;
                break;
            case FETCH_SUCCESS:
                draft.isSuccess = true;
                draft.isProgress = false;
                draft.error = null;
                break;
            case FETCH_ERROR:
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
