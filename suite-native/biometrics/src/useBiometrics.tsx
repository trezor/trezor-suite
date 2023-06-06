import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { useAlert, Alert } from '@suite-native/alerts';

import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';
import { useIsBiometricsEnabled, useIsUserAuthenticated } from './biometricsAtoms';

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
    const { isBiometricsOptionEnabled, setIsBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const appState = useRef(AppState.currentState);
    const { isUserAuthenticated, setIsUserAuthenticated } = useIsUserAuthenticated();
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
    }, [
        isBiometricsOptionEnabled,
        setIsBiometricsOptionEnabled,
        setIsUserAuthenticated,
        showAlert,
    ]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            // Re-authenticate user when app is opened from background
            if (appState.current === 'background' && nextAppState === 'active') {
                if (isBiometricsOptionEnabled && !isUserAuthenticated) {
                    const auth = async () => {
                        const result = await authenticate();

                        const resultHasError = result && !result.success;

                        // In some cases, if auth happens too quickly after closing app, it will fail with unknown error.
                        // User don't need to authenticate at this point. The library doesn't accept authentication that's been less than few seconds after closing app.
                        if (resultHasError && result.error.startsWith('unknown:')) {
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

    // First authentication after app being opened after being killed (not just backgrounded)
    useEffect(() => {
        const auth = async () => {
            if (isBiometricsOptionEnabled && !isUserAuthenticated) {
                const result = await authenticate();

                if (result && result.success) {
                    setIsUserAuthenticated(true);
                }
            }
        };

        auth();
        // Only run once on app start from killed state
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        toggleBiometricsOption,
    };
};
