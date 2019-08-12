import {
    toggleCheckbox,
    setEmail,
    submitEmail,
    setSkipped,
} from '@suite/actions/onboarding/newsletterActions';

export interface NewsletterReducer {
    email: string;
    skipped: boolean;
    checkboxes: Checkbox[];
    isProgress: boolean;
    isSuccess: boolean;
    error: null | string;
}

export interface NewsletterActions {
    toggleCheckbox: typeof toggleCheckbox;
    setEmail: typeof setEmail;
    submitEmail: typeof submitEmail;
    setSkipped: typeof setSkipped;
}

export interface Checkbox {
    value: boolean;
    label: string;
}

export const TOGGLE_CHECKBOX = '@onboarding/newsletter-set-checkbox';
export const SET_EMAIL = '@onboarding/newsletter-set-email';
export const SET_SKIPPED = '@onboarding/newsletter-set-skipped';
export const SUBMIT_EMAIL = '@onboarding/newsletter-submit-email';
export const FETCH_START = '@onboarding/newsletter-fetch-start';
export const FETCH_SUCCESS = '@onboarding/newsletter-fetch-success';
export const FETCH_ERROR = '@onboarding/newsletter-fetch-error';

interface ToggleCheckboxAction {
    type: typeof TOGGLE_CHECKBOX;
    checkbox: string;
}

interface SetEmailAction {
    type: typeof SET_EMAIL;
    email: string;
}

interface SetSkippedAction {
    type: typeof SET_SKIPPED;
    skipped: boolean;
}

interface FetchStartAction {
    type: typeof FETCH_START;
}

interface FetchSuccessAction {
    type: typeof FETCH_SUCCESS;
}

interface FetchErrorAction {
    type: typeof FETCH_ERROR;
    error: string;
}

export type NewsletterActionTypes =
    | ToggleCheckboxAction
    | SetEmailAction
    | SetSkippedAction
    | FetchStartAction
    | FetchSuccessAction
    | FetchErrorAction;
