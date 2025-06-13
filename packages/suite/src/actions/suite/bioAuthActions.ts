import { createAction } from '@reduxjs/toolkit';

import * as BIOAUTH from './constants/bioAuthConstants';

const setBioAuthEnabled = createAction(BIOAUTH.SET_BIO_AUTH_ENABLED, (payload: boolean) => ({
    payload,
}));

const requestBioAuthChange = createAction(BIOAUTH.REQUEST_BIO_AUTH_CHANGE, (payload: boolean) => ({
    payload,
}));

const requestBioAuthChangeEnd = createAction(BIOAUTH.REQUEST_BIO_AUTH_CHANGE_END);

const bioAuthValidated = createAction(
    BIOAUTH.REQUEST_BIO_AUTH_VALIDATED,
    (payload: string /* Date.toUTCString() */ | null) => ({ payload }),
);

const bioAuthWindowBlur = createAction(
    BIOAUTH.BIO_AUTH_WINDOW_BLUR,
    (payload: string /* Date.toUTCString() */) => ({
        payload,
    }),
);

const bioAuthWindowFocus = createAction(
    BIOAUTH.BIO_AUTH_WINDOW_FOCUS,
    (payload: string /* Date.toUTCString() */) => ({
        payload,
    }),
);

const toggleBioAuthValidationRequested = createAction(
    BIOAUTH.TOGGLE_BIO_AUTH_VALIDATION_REQUESTED,
    (payload: boolean) => ({
        payload,
    }),
);

const setBioAuthAvailable = createAction(BIOAUTH.SET_BIO_AUTH_AVAILABLE, (payload: boolean) => ({
    payload,
}));

const initBioAuth = createAction(BIOAUTH.INIT_BIO_AUTH, (payload: number) => ({
    payload,
}));

export const bioAuthActions = {
    setBioAuthEnabled,
    requestBioAuthChange,
    requestBioAuthChangeEnd,
    setBioAuthAvailable,
    bioAuthValidated,
    bioAuthWindowBlur,
    bioAuthWindowFocus,
    initBioAuth,
    toggleBioAuthValidationRequested,
} as const;

export type BioAuthAction = ReturnType<(typeof bioAuthActions)[keyof typeof bioAuthActions]>;
