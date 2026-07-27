import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
import { useTranslate } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { selectHasPassphraseIncorrectError } from '@suite-native/passphrase';

export const useHandleNavigateToInitialScreenOnIdle = () => {
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const hasPassphraseIncorrectError = useSelector(selectHasPassphraseIncorrectError);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle && !isDiscoveryRunning) {
                if (hasPassphraseIncorrectError) {
                    showAlert({
                        title: translate('modulePassphrase.featureAuthorizationError'),
                        pictogramVariant: 'critical',
                        primaryButtonTitle: translate('generic.buttons.close'),
                        primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                        onPressPrimaryButton: navigateToInitialScreen,
                    });
                } else {
                    navigateToInitialScreen();
                }
            }
        }, [
            deviceAuthorizationStep,
            hasPassphraseIncorrectError,
            isDiscoveryRunning,
            navigateToInitialScreen,
            showAlert,
            translate,
        ]),
    );
};
