import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    selectInputPassphraseOnDevice,
    selectIsCreatingNewPassphraseWallet,
} from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

import { PassphraseEnterOnTrezorScreen } from './PassphraseEnterOnTrezorScreen';

export const PassphraseConfirmFeatureUnlockEnterOnTrezoreScreen = () => {
    const isCreatingNewPassphraseWallet = useSelector(selectIsCreatingNewPassphraseWallet);
    const inputPassphraseOnDevice = useSelector(selectInputPassphraseOnDevice);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useEffect(() => {
        if (!isCreatingNewPassphraseWallet && !inputPassphraseOnDevice) {
            // NOTE: this means that the device passphrase request was fulfilled either success or not,
            // TzoreConnect will trigger proper events globaly and this will be reopened if needed
            navigateToInitialScreen();
        }
    }, [isCreatingNewPassphraseWallet, inputPassphraseOnDevice, navigateToInitialScreen]);

    return <PassphraseEnterOnTrezorScreen />;
};
