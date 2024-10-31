import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectDeviceRequestedAuthorization,
    selectHasAuthFailed,
    selectHasVerificationCancelledError,
    selectPassphraseError,
    useAuthorizationGoBack,
} from '@suite-native/device-authorization';
import { EventType, analytics } from '@suite-native/analytics';

export const useRedirectOnPassphraseCompletion = () => {
    const hasDeviceRequestedAuthorization = useSelector(selectDeviceRequestedAuthorization);
    const hasPassphraseError = useSelector(selectPassphraseError);
    const hasAuthorizationFailed = useSelector(selectHasAuthFailed);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);

    const dispatch = useDispatch();

    const { handleGoBack } = useAuthorizationGoBack();

    const route = useRoute();

    useEffect(() => {
        // If there is passphrase error, we don't want to go back, but handle errors through alerts within the flow
        if (!hasDeviceRequestedAuthorization && !hasPassphraseError) {
            handleGoBack();
        }
    }, [handleGoBack, hasDeviceRequestedAuthorization, hasPassphraseError]);

    useEffect(() => {
        // User has canceled the authorization process on device (authorizeDeviceThunk rejects with auth-failed error)
        if (hasAuthorizationFailed || hasVerificationCancelledError) {
            analytics.report({
                type: EventType.PassphraseExit,
                payload: { screen: route.name },
            });
            dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
        }
    }, [dispatch, hasAuthorizationFailed, hasVerificationCancelledError, route.name]);
};
