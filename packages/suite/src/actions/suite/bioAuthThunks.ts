import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import { Dispatch } from 'src/types/suite';

import { bioAuthActions } from './bioAuthActions';

const BIO_AUTH_PREFIX = '@suite/bioAuth';

const KNOWN_ERROR_MESSAGES = ['Authentication canceled.', 'Authentication cancelled.'];

const handleError = (error: string, dispatch: Dispatch, message: string) => {
    if (KNOWN_ERROR_MESSAGES.some(message => error.includes(message))) {
        // NOTE: known error message
        return;
    }
    dispatch(
        notificationsActions.addToast({
            type: 'error',
            error: message,
        }),
    );
};

export const init = createThunk(`${BIO_AUTH_PREFIX}/init`, (_args, { dispatch }) => {
    // settings
    desktopApi.getBioAuthSettings().then(settings => {
        console.log('get settings', settings);
        dispatch(bioAuthActions.setBioAuthEnabled(settings.enabled));
    });
    desktopApi.on('bio-auth/settings-changed', settings => {
        console.log('bio-auth/settings-changed', settings);
        dispatch(bioAuthActions.setBioAuthEnabled(settings.enabled));
    });

    // api availability
    desktopApi.isBioAuthAvailable().then(available => {
        console.log('initial availability', available);
        dispatch(bioAuthActions.setIsBioAuthAvailable(available));
    });

    // validation status
    desktopApi.getBioAuthStatus().then(validated => {
        console.log('initial validation status', validated);
        dispatch(bioAuthActions.setIsBioAuthValidationRequired(!validated));
    });
    desktopApi.on('bio-auth/validation-status-changed', validated => {
        console.log('validation status changed', validated);
        dispatch(bioAuthActions.setIsBioAuthValidationRequired(!validated));
    });
    desktopApi.on('bio-auth/bio-auth-availability-changed', available => {
        console.log('bio-auth availability changed', available);
        dispatch(bioAuthActions.setIsBioAuthAvailable(available));
    });
});

interface RequestBioAuthChangeThunkParams {
    payload: boolean;
    messageSuccess: string;
    messageError: string;
}

export const requestBioAuthChangeThunk = createThunk(
    `${BIO_AUTH_PREFIX}/requestBioAuthChangeThunk`,
    async (
        { payload, messageSuccess, messageError }: RequestBioAuthChangeThunkParams,
        { dispatch },
    ) => {
        if (!(await desktopApi.isBioAuthAvailable())) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Biometric authentication not available',
                }),
            );

            return;
        }

        const result = await desktopApi.validateBioAuth({
            message: messageSuccess,
        });
        if (!result.success) {
            return handleError(result.message, dispatch, messageError);
        } else {
            await desktopApi.setBioAuthSettings({ enabled: payload });
        }
    },
);

interface RequestBioAuthValidationThunkParams {
    messageSuccess: string;
    messageError: string;
}

export const requestBioAuthValidationThunk = createThunk(
    `${BIO_AUTH_PREFIX}/validateAuth`,
    async ({ messageSuccess, messageError }: RequestBioAuthValidationThunkParams, { dispatch }) => {
        if (!(await desktopApi.isBioAuthAvailable())) {
            await desktopApi.setBioAuthSettings({ enabled: false });
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Biometric authentication not available',
                }),
            );

            return;
        }

        dispatch(bioAuthActions.setCancelled(false));

        const result = await desktopApi.validateBioAuth({
            message: messageSuccess,
        });
        console.log('result of bio-auth validation', result);
        if (!result.success) {
            dispatch(bioAuthActions.setCancelled(true));

            return handleError(result.message, dispatch, messageError);
        }
    },
);
