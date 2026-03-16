import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import { type Dispatch } from 'src/types/suite';

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
    // only fetches settings from electron-store, not dependent on BioAuthModule, see bio-auth/get-bio-auth-settings
    desktopApi.getBioAuthSettings().then(settings => {
        dispatch(bioAuthActions.setBioAuthEnabled(settings.enabled));
    });
    desktopApi.on('bio-auth/settings-changed', settings => {
        dispatch(bioAuthActions.setBioAuthEnabled(settings.enabled));
    });

    const onBioAuthAvailable = (available: boolean) => {
        dispatch(bioAuthActions.setIsBioAuthAvailable(available));
        // ensure this api is called regardlesss if the bio auth is available or not
        desktopApi.getBioAuthStatus().then(validated => {
            dispatch(bioAuthActions.setIsBioAuthValidationRequired(!validated));
        });
    };

    // We don't know what will be faster, BioAuthModule may initialize before or after this thunk.
    // Fetch api availability if BioAuthModule is initialized (though it may never become available, depending on the system)
    desktopApi.isBioAuthAvailable().then(onBioAuthAvailable);

    // If BioAuthModule initializes later, it will emit an event, which will be caught here
    desktopApi.on('bio-auth/bio-auth-availability-changed', onBioAuthAvailable);
    desktopApi.on('bio-auth/validation-status-changed', validated => {
        dispatch(bioAuthActions.setIsBioAuthValidationRequired(!validated));
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
        if (!result.success) {
            dispatch(bioAuthActions.setCancelled(true));

            return handleError(result.message, dispatch, messageError);
        }
    },
);
