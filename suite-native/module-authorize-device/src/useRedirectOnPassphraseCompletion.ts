import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectDeviceRequestedAuthorization,
    selectHasAuthFailed,
    selectHasVerificationCancelledError,
    selectPassphraseError,
} from '@suite-native/device-authorization';
import { useAuthorizationGoBack } from '@suite-native/device-authorization';

export const useRedirectOnPassphraseCompletion = () => {
    const hasDeviceRequestedAuthorization = useSelector(selectDeviceRequestedAuthorization);
    const hasPassphraseError = useSelector(selectPassphraseError);
    const hasAuthorizationFailed = useSelector(selectHasAuthFailed);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);

    const dispatch = useDispatch();

    const { handleGoBack } = useAuthorizationGoBack();

    useEffect(() => {
        // If there is passphrase error, we don't want to go back, but handle errors through alerts within the flow
        if (!hasDeviceRequestedAuthorization && !hasPassphraseError) {
            handleGoBack();
        }
    }, [handleGoBack, hasDeviceRequestedAuthorization, hasPassphraseError]);

    useEffect(() => {
        // User has canceled the authorization process on device (authorizeDeviceThunk rejects with auth-failed error)
        if (hasAuthorizationFailed || hasVerificationCancelledError) {
            dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
        }
    }, [dispatch, hasAuthorizationFailed, hasVerificationCancelledError]);
};
