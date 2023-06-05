import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

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
    // TODO else return false and display alert that biometrics is not available
};

export const useBiometrics = () => {
    const appState = useRef(AppState.currentState);
    const { isBiometricsOptionEnabled, setIsBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(!isBiometricsOptionEnabled);
    const isBiometricsModalOpen = useRef(false);
    const [shouldShowBiometricOverlay, setShouldShowBiometricOverlay] = useState(false);

    const toggleBiometricsOption = useCallback(async () => {
        try {
            const result = await authenticate();
            console.log('result', result);
            if (isBiometricsOptionEnabled) {
                setIsBiometricsOptionEnabled(false);
                setIsUserAuthenticated(false);
            } else {
                setIsBiometricsOptionEnabled(true);
                setIsUserAuthenticated(true);
            }
        } catch (error) {
            console.error(error);
        }
    }, [isBiometricsOptionEnabled, setIsBiometricsOptionEnabled]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current === 'background' && nextAppState === 'active') {
                setShouldShowBiometricOverlay(true);
                if (isBiometricsOptionEnabled && !isUserAuthenticated) {
                    const auth = async () => {
                        try {
                            const result = await authenticate();

                            if (result && result?.success) {
                                console.log('user authenticated');

                                setIsUserAuthenticated(true);
                            }
                        } catch (error) {
                            console.error(error);
                        }
                        setShouldShowBiometricOverlay(false);
                    };
                    auth();
                }
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [isBiometricsOptionEnabled, isUserAuthenticated, setIsUserAuthenticated]);

    return {
        toggleBiometricsOption,
        isUserAuthenticated,
        isBiometricsOptionEnabled,
        isBiometricsModalOpen,
        shouldShowBiometricOverlay,
    };
};
