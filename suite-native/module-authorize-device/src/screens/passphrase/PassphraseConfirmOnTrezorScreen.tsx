import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceRequestedPassphrase } from '@suite-native/device-authorization';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { PassphraseConfirmOnTrezorScreenContent } from '@suite-native/passphrase';

import { AuthorizeDeviceScreenHeader } from '../../components/AuthorizeDeviceScreenHeader';

export const PassphraseConfirmOnTrezorScreen = () => {
    const hasDeviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useEffect(() => {
        if (!hasDeviceRequestedPassphrase) {
            // NOTE: this means that the device passphrase request was fulfilled either success or not,
            // TzoreConnect will trigger proper events globaly and this will be reopened if needed
            navigateToInitialScreen();
        }
    }, [hasDeviceRequestedPassphrase, navigateToInitialScreen]);

    return (
        <Screen header={<AuthorizeDeviceScreenHeader />}>
            <PassphraseConfirmOnTrezorScreenContent />
        </Screen>
    );
};
