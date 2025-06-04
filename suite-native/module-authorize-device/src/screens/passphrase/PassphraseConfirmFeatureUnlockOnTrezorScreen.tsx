import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    selectDeviceRequestedPassphrase,
    selectIsCreatingNewPassphraseWallet,
} from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

import { PassphraseConfirmOnTrezorScreen } from './PassphraseConfirmOnTrezorScreen';

export const PassphraseConfirmFeatureUnlockOnTrezorScreen = () => {
    const isCreatingNewPassphraseWallet = useSelector(selectIsCreatingNewPassphraseWallet);
    const hasDeviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useEffect(() => {
        if (!isCreatingNewPassphraseWallet && !hasDeviceRequestedPassphrase) {
            // NOTE: this means that the device passphrase request was fulfilled either success or not,
            // TzoreConnect will trigger proper events globaly and this will be reopened if needed
            navigateToInitialScreen();
        }
    }, [isCreatingNewPassphraseWallet, hasDeviceRequestedPassphrase, navigateToInitialScreen]);

    return <PassphraseConfirmOnTrezorScreen />;
};
