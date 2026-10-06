import { createAction } from '@reduxjs/toolkit';

import * as BIOAUTH from './constants/bioAuthConstants';

const setBioAuthEnabled = createAction(BIOAUTH.SET_BIO_AUTH_ENABLED, (payload: boolean) => ({
    payload,
}));

const setIsBioAuthAvailable = createAction(BIOAUTH.SET_BIO_AUTH_AVAILABLE, (payload: boolean) => ({
    payload,
}));

const setIsBioAuthValidationRequired = createAction(
    BIOAUTH.SET_BIO_AUTH_VALIDATION_REQUIRED,
    (payload: boolean) => ({ payload }),
);

export const setCancelled = createAction(BIOAUTH.SET_BIO_AUTH_CANCELLED, (payload: boolean) => ({
    payload,
}));

export const bioAuthActions = {
    setBioAuthEnabled,
    setIsBioAuthAvailable,
    setIsBioAuthValidationRequired,
    setCancelled,
} as const;
