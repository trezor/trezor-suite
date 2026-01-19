import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
import { Screen, useNavigateToInitialScreen } from '@suite-native/navigation';
import { PassphraseConfirmOnTrezorScreenContent } from '@suite-native/passphrase';

import { AuthorizeDeviceScreenHeader } from '../../components/AuthorizeDeviceScreenHeader';

export const PassphraseConfirmOnTrezorScreen = () => {
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle) {
                // NOTE: this means that the device passphrase request was fulfilled either success or not,
                // TzoreConnect will trigger proper events globaly and this will be reopened if needed
                navigateToInitialScreen();
            }
        }, [deviceAuthorizationStep, navigateToInitialScreen]),
    );

    return (
        <Screen header={<AuthorizeDeviceScreenHeader />}>
            <PassphraseConfirmOnTrezorScreenContent />
        </Screen>
    );
};
