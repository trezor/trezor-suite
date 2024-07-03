import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectIsCreatingNewPassphraseWallet } from '@suite-native/passphrase';

import { selectDeviceRequestedAuthorization } from '../deviceAuthorizationSlice';
import { useAuthorizationGoBack } from './useAuthorizationGoBack';

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
