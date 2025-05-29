import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import {
    selectBioAuthEnabled,
    selectIsBioAuthValidationRequested,
    selectIsRequestingBioAuthChange,
} from 'src/reducers/desktop';

import {
    bioAuthValidated,
    requestBioAuthChange,
    requestBioAuthChangeEnd,
    setBioAuthEnabled,
    toggleBioAuthValidationRequested,
} from './suiteActions';

const BIO_AUTH_PREFIX = '@suite/bioAuth';

export const requestBioAuthChangeThunk = createThunk(
    `${BIO_AUTH_PREFIX}/requestBioAuthChangeThunk`,
    async (_, { dispatch, getState }) => {
        const prevBioEnabled = selectBioAuthEnabled(getState());
        const isRequestingChange = selectIsRequestingBioAuthChange(getState());
        const nextBioEnabled = !prevBioEnabled;

        if (isRequestingChange || selectIsBioAuthValidationRequested(getState())) {
            return;
        }

        dispatch(requestBioAuthChange(nextBioEnabled));

        try {
            await desktopApi.validateBioAuth();

            dispatch(setBioAuthEnabled(nextBioEnabled));
            dispatch(bioAuthValidated(new Date()));
        } catch (error) {
            dispatch(bioAuthValidated(null));
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Biometric authentication failed',
                }),
            );
        } finally {
            dispatch(requestBioAuthChangeEnd());
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

        dispatch(toggleBioAuthValidationRequested(true));
        try {
            await desktopApi.validateBioAuth();
            dispatch(bioAuthValidated(new Date()));
        } catch (error) {
            dispatch(bioAuthValidated(null));
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Biometric authentication failed',
                }),
            );
        } finally {
            dispatch(toggleBioAuthValidationRequested(false));
        }
    },
);
