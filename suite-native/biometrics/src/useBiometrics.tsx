import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';
import { useIsBiometricsEnabled, useIsUserAuthenticated } from './biometricsAtoms';

export const authenticate = async () => {
    const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

    if (isBiometricsAvailable) {
        const result = await LocalAuthentication.authenticateAsync();
        return result;
    }
};

export const useBiometrics = () => {
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const appState = useRef(AppState.currentState);
    const { isUserAuthenticated, setIsUserAuthenticated } = useIsUserAuthenticated();

    const handleAuthentication = useCallback(async () => {
        if (isBiometricsOptionEnabled && !isUserAuthenticated) {
            const result = await authenticate();

            if (result && result?.success) {
                setIsUserAuthenticated(true);
            } else {
                handleAuthentication();
            }
        }
    }, [isBiometricsOptionEnabled, isUserAuthenticated, setIsUserAuthenticated]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            // Re-authenticate user when app is opened from background
            if (appState.current === 'background' && nextAppState === 'active') {
                if (isBiometricsOptionEnabled && !isUserAuthenticated) {
                    const auth = async () => {
                        await handleAuthentication();
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
    }, [
        handleAuthentication,
        isBiometricsOptionEnabled,
        isUserAuthenticated,
        setIsUserAuthenticated,
    ]);

    // First authentication after app being opened after being killed (not just backgrounded)
    useEffect(() => {
        const auth = async () => {
            await handleAuthentication();
        };

        auth();
        // Only run once on app start from killed state
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
