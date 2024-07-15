import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    selectDeviceRequestedAuthorization,
    selectPassphraseError,
} from '@suite-native/device-authorization';
import { useAuthorizationGoBack } from '@suite-native/device-authorization';

export const useRedirectOnPassphraseCompletion = () => {
    const hasDeviceRequestedAuthorization = useSelector(selectDeviceRequestedAuthorization);
    const hasPassphraseError = useSelector(selectPassphraseError);

    const { handleGoBack } = useAuthorizationGoBack();

    useEffect(() => {
        // If there is passphrase error, we don't want to go back, but handle errors through alerts within the flow
        if (!hasDeviceRequestedAuthorization && !hasPassphraseError) {
            handleGoBack();
        }
    }, [handleGoBack, hasDeviceRequestedAuthorization, hasPassphraseError]);
};
