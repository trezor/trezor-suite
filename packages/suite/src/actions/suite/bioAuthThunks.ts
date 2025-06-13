import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import {
    BLUR_LOCK_TIMEOUT_MS,
    selectBioAuthEnabled,
    selectBlurTimeoutId,
    selectIsBioAuthAvailableStateKnown,
    selectIsBioAuthValidationRequested,
    selectIsBioAuthValidationRequired,
    selectIsRequestingBioAuthChange,
} from 'src/reducers/bioAuth';

import { bioAuthActions } from './bioAuthActions';
import * as storageActions from './storageActions';

const BIO_AUTH_PREFIX = '@suite/bioAuth';

export const bioAuthWindowBlurThunk = createThunk(
    `${BIO_AUTH_PREFIX}/bioAuthWindowBlurThunk`,
    (date: Date, { dispatch, getState }) => {
        const blurTimeoutId = selectBlurTimeoutId(getState());
        if (blurTimeoutId) {
            clearTimeout(blurTimeoutId);
        }

        const timeoutId = setTimeout(() => {
            dispatch(bioAuthActions.setBioAuthValidationRequired());
        }, BLUR_LOCK_TIMEOUT_MS);

        dispatch(
            bioAuthActions.bioAuthWindowBlur({
                blurDate: date.toUTCString(),
                timeoutId,
            }),
        );
    },
);

export const bioAuthWindowFocusThunk = createThunk(
    `${BIO_AUTH_PREFIX}/bioAuthWindowFocusThunk`,
    (date: Date, { dispatch, getState }) => {
        const blurTimeoutId = selectBlurTimeoutId(getState());
        if (blurTimeoutId) {
            clearTimeout(blurTimeoutId);
        }

        const validationRequired = selectIsBioAuthValidationRequired(getState());

        if (validationRequired) {
            dispatch(bioAuthActions.setBioAuthValidationRequired());
        }
        dispatch(bioAuthActions.bioAuthWindowFocus(date.toUTCString()));
    },
);

export const requestBioAuthChangeThunk = createThunk(
    `${BIO_AUTH_PREFIX}/requestBioAuthChangeThunk`,
    async (_, { dispatch, getState }) => {
        const prevBioEnabled = selectBioAuthEnabled(getState());
        const isRequestingChange = selectIsRequestingBioAuthChange(getState());
        const nextBioEnabled = !prevBioEnabled;

        if (isRequestingChange || selectIsBioAuthValidationRequested(getState())) {
            return;
        }

        dispatch(bioAuthActions.requestBioAuthChange(nextBioEnabled));

        try {
            await desktopApi.validateBioAuth();

            dispatch(bioAuthActions.setBioAuthEnabled(nextBioEnabled));
            dispatch(bioAuthActions.bioAuthValidated(new Date().toUTCString()));
            // Persist bioAuthEnabled to storage
            dispatch(storageActions.saveBioAuth());
        } catch (error) {
            dispatch(bioAuthActions.bioAuthValidated(null));
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Biometric authentication failed',
                }),
            );
        } finally {
            dispatch(bioAuthActions.requestBioAuthChangeEnd());
        }
    },
);

export const requestBioAuthValidationThunk = createThunk(
    `${BIO_AUTH_PREFIX}/validateAuth`,
    async (_, { dispatch, getState }) => {
        const isRequestingValidation = selectIsBioAuthValidationRequested(getState());

        if (isRequestingValidation) {
            return;
        }

        dispatch(bioAuthActions.toggleBioAuthValidationRequested(true));
        try {
            await desktopApi.validateBioAuth();
            dispatch(bioAuthActions.bioAuthValidated(new Date().toUTCString()));
            const blurTimeoutId = selectBlurTimeoutId(getState());
            if (blurTimeoutId) {
                clearTimeout(blurTimeoutId);
            }
        } catch (error) {
            dispatch(bioAuthActions.bioAuthValidated(null));
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Biometric authentication failed',
                }),
            );
        } finally {
            dispatch(bioAuthActions.toggleBioAuthValidationRequested(false));
        }
    },
);

export const checkBioAuthAvailableThunk = createThunk(
    `${BIO_AUTH_PREFIX}/checkBioAuthAvailableThunk`,
    async (_, { dispatch, getState }) => {
        if (selectIsBioAuthAvailableStateKnown(getState())) {
            return;
        }

        const isAvailable = await desktopApi.isBioAuthAvailable();
        dispatch(bioAuthActions.setBioAuthAvailable(isAvailable));
    },
);
