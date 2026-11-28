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
import {
    selectHasPassphraseIncorrectError,
    selectIsDiscoveryLoadingAccounts,
} from '@suite-native/passphrase';

export const useHandleNavigateToInitialScreenOnIdle = () => {
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const hasPassphraseIncorrectError = useSelector(selectHasPassphraseIncorrectError);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isDiscoveryLoadingAccounts = useSelector(selectIsDiscoveryLoadingAccounts);
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    // A wrong passphrase can only fail discovery before it loads accounts, so the rest of the
    // discovery is not worth blocking on.
    const isPassphraseCheckDone = !isDiscoveryRunning || isDiscoveryLoadingAccounts;

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle && isPassphraseCheckDone) {
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
            isPassphraseCheckDone,
            navigateToInitialScreen,
            showAlert,
            translate,
        ]),
    );
};
