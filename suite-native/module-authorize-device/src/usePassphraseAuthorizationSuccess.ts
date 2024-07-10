import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    selectIsCreatingNewPassphraseWallet,
    selectDeviceRequestedAuthorization,
} from '@suite-native/device-authorization';
import { useAuthorizationGoBack } from '@suite-native/device-authorization';

export const useAuthorizationSuccess = () => {
    const hasDeviceRequestedAuthorization = useSelector(selectDeviceRequestedAuthorization);
    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);

    const { handleGoBack } = useAuthorizationGoBack();

    // Success state of authorizing device to be used by feature (e.g. receive address, send, etc.)
    useEffect(() => {
        if (!hasDeviceRequestedAuthorization && !isCreatingNewWalletInstance) {
            handleGoBack();
        }
    }, [handleGoBack, hasDeviceRequestedAuthorization, isCreatingNewWalletInstance]);
};
