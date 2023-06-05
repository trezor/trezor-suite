import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { Alert, useAlert } from '@suite-native/alerts';

import { useIsBiometricsEnabled } from './biometricsAtoms';
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';

const authenticate = async () => {
    if (Platform.OS === 'android') {
        // Cancel any previous authentication attempt. (Only available for android)
        await LocalAuthentication.cancelAuthenticate();
    }

    const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();
    if (isBiometricsAvailable) {
        const result = await LocalAuthentication.authenticateAsync();
        return result;
    }
};

const authenticationCanceledAlert: Alert = {
    title: 'Authentication canceled',
    description: 'You will have to try again.',
    pictogramVariant: 'red',
    icon: 'warningCircle',
    onPressPrimaryButton: authenticate,
    primaryButtonTitle: 'Try again',
    secondaryButtonTitle: 'Cancel',
    onPressSecondaryButton: () => null,
};

const biometricNotAvailableAlert: Alert = {
    title: 'Biometrics',
    description:
        'No security features on your device. Make sure you have biometrics setup on your phone and try again.',
    primaryButtonTitle: 'Cancel',
    onPressPrimaryButton: () => null,
    icon: 'warningCircle',
    pictogramVariant: 'yellow',
};

export const useBiometrics = () => {
    const appState = useRef(AppState.currentState);
    const { isBiometricsOptionEnabled, setIsBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(!isBiometricsOptionEnabled);
    const { showAlert } = useAlert();

    const toggleBiometricsOption = useCallback(async () => {
        const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

        if (!isBiometricsAvailable) {
            showAlert(biometricNotAvailableAlert);
            return;
        }

        const authResult = await authenticate();

        if (!authResult?.success) {
            return;
        }

        if (isBiometricsOptionEnabled) {
            setIsBiometricsOptionEnabled(false);
            setIsUserAuthenticated(false);
        } else {
            setIsBiometricsOptionEnabled(true);
            setIsUserAuthenticated(true);
        }
    }, [isBiometricsOptionEnabled, setIsBiometricsOptionEnabled, showAlert]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current === 'background' && nextAppState === 'active') {
                if (isBiometricsOptionEnabled && !isUserAuthenticated) {
                    const auth = async () => {
                        const result = await authenticate();

                        const resultHasError = result && !result.success;

                        if (resultHasError && result.error.startsWith('unknown: -1000')) {
                            // User don't need to authenticate at this point. The library doesn't accept authentication that's been less than few seconds after closing app.
                            return;
                        }

                        const authenticationFailedErrors =
                            resultHasError && result.error === 'user_cancel';

                        if (authenticationFailedErrors) {
                            showAlert(authenticationCanceledAlert);
                        }

                        if (result && result?.success) {
                            setIsUserAuthenticated(true);
                        }
                    };
                    auth();
                }
            }

            if (appState.current === 'active' && nextAppState !== 'active') {
                setIsUserAuthenticated(false);
            }

            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [isBiometricsOptionEnabled, isUserAuthenticated, setIsUserAuthenticated, showAlert]);

    return {
        toggleBiometricsOption,
        isUserAuthenticated,
        isBiometricsOptionEnabled,
    };
};
