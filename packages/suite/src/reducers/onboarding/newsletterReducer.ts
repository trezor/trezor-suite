import {
    NewsletterReducer,
    NewsletterActionTypes,
    Checkbox,
    TOGGLE_CHECKBOX,
    SET_EMAIL,
    SET_SKIPPED,
} from '@suite/types/onboarding/newsletter';

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
};

const newsletter = (
    state: NewsletterReducer = initialState,
    action: NewsletterActionTypes,
): NewsletterReducer => {
    switch (action.type) {
        case TOGGLE_CHECKBOX:
            return {
                ...state,
                checkboxes: state.checkboxes.map((checkbox: Checkbox) => {
                    const toggled = checkbox;
                    if (checkbox.label === action.checkbox) {
                        toggled.value = !checkbox.value;
                    }
                    return toggled;
                }),
            };
        case SET_EMAIL:
            return {
                ...state,
                email: action.email,
            };
        case SET_SKIPPED:
            return {
                ...state,
                skipped: true,
            };
        default:
            return state;
    }
};

export default newsletter;
