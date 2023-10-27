import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, NativeEventSubscription, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';
import {
    useIsBiometricsEnabled,
    useIsBiometricsOverlayVisible,
    useIsUserAuthenticated,
} from './biometricsAtoms';

/**
 * The time period for which is user not asked to be authenticated again if returns back to the app.
 */
const KEEP_LOGGED_IN_TIMEOUT = 30_000;

export const authenticate = async () => {
    const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

    if (isBiometricsAvailable) {
        const result = await LocalAuthentication.authenticateAsync();
        return result;
    }
};

export const useBiometrics = () => {
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { isUserAuthenticated, setIsUserAuthenticated } = useIsUserAuthenticated();
    const { setIsBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);
    const goneToBackgroundAtTimestamp = useRef<null | number>(null);

    const handleAuthentication = useCallback(async () => {
        // Stop the authentication flow if the user leaves the app.
        if (appState.current !== 'active' && Platform.OS === 'android') {
            LocalAuthentication.cancelAuthenticate();
            return;
        }

        if (isBiometricsOptionEnabled && !isUserAuthenticated) {
            const result = await authenticate();

            if (result && result?.success) {
                setIsUserAuthenticated(true);
                setIsBiometricsOverlayVisible(false);
            } else {
                handleAuthentication();
            }
        }
    }, [
        isBiometricsOptionEnabled,
        isUserAuthenticated,
        setIsUserAuthenticated,
        setIsBiometricsOverlayVisible,
    ]);

    // Monitors AppState and adjust the authentication state accordingly.
    useEffect(() => {
        const changeSubscription = AppState.addEventListener('change', nextAppState => {
            switch (nextAppState) {
                case 'active':
                    if (
                        // Revoke user authentication if the timeout has run out.
                        appState.current === 'background' &&
                        goneToBackgroundAtTimestamp.current &&
                        goneToBackgroundAtTimestamp.current < Date.now() - KEEP_LOGGED_IN_TIMEOUT
                    ) {
                        setIsUserAuthenticated(false);
                    } else if (isUserAuthenticated) {
                        setIsBiometricsOverlayVisible(false);
                    }

                    break;

                case 'background':
                    setIsBiometricsOverlayVisible(true);
                    goneToBackgroundAtTimestamp.current = Date.now();
                    break;

                case 'inactive':
                    setIsBiometricsOverlayVisible(true);
                    break;

                default:
                    return;
            }

            appState.current = nextAppState;
            setAppStateVisible(appState.current);
        });

        return () => {
            changeSubscription.remove();
        };
    }, [
        isBiometricsOptionEnabled,
        setIsUserAuthenticated,
        setIsBiometricsOverlayVisible,
        isUserAuthenticated,
    ]);

    /* 
        The AppState `change` event is on Android emitted to late to rerender the UI, so the content 
        of the screen would be visible when the app is in the background. To make the biometrics
        overlay visible, the Android specific `blur` and `focus` listeners are needed.
    */
    useEffect(() => {
        let blurSubscription: NativeEventSubscription | undefined;
        let focusSubscription: NativeEventSubscription | undefined;

        if (Platform.OS === 'android') {
            blurSubscription = AppState.addEventListener('blur', () =>
                setIsBiometricsOverlayVisible(true),
            );

            focusSubscription = AppState.addEventListener('focus', () =>
                setIsBiometricsOverlayVisible(false),
            );
        }

        return () => {
            blurSubscription?.remove();
            focusSubscription?.remove();
        };
    }, [setIsBiometricsOverlayVisible]);

    // Ask the user for an authentication whenever the authentication state changes.
    useEffect(() => {
        const auth = async () => {
            await handleAuthentication();
        };

        // Ask for authentication only if the app is in active opened state.
        if (appStateVisible === 'active') auth();

        // Only run once on app start from killed state
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appStateVisible, isUserAuthenticated, isBiometricsOptionEnabled]);
};
