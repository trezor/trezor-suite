import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

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
    const [isBiometricsAuthenticationAllowed, setIsBiometricsAuthenticationAllowed] =
        useState(true);
    const goneToBackgroundAtTimestamp = useRef<null | number>(null);

    // Monitors AppState and adjust the authentication state accordingly.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
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
                    setIsBiometricsAuthenticationAllowed(true);
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

        return () => subscription.remove();
    }, [
        isBiometricsOptionEnabled,
        setIsUserAuthenticated,
        setIsBiometricsOverlayVisible,
        isUserAuthenticated,
        setIsBiometricsAuthenticationAllowed,
    ]);

    const requestAuthenticationCheck = () => setIsBiometricsAuthenticationAllowed(true);

    const doAuthentication = useCallback(async () => {
        const result = await authenticate();

        setIsBiometricsAuthenticationAllowed(false);

        if (result?.success) {
            setIsUserAuthenticated(true);
            setIsBiometricsOverlayVisible(false);
        }
    }, [setIsBiometricsOverlayVisible, setIsUserAuthenticated]);

    // Request authentication check whenever the authentication state changes
    // or when biometrics is enabled in settings (isBiometricsOptionEnabled)
    // and also when app state changes
    // and if auth allowance changes
    useEffect(() => {
        // if appState is not active we want to cancel the flow by returning
        if (appState.current !== 'active') {
            // and on android also cancel the auth
            if (Platform.OS === 'android' && isBiometricsOptionEnabled) {
                LocalAuthentication.cancelAuthenticate();
            }

            return;
        }

        if (
            isBiometricsOptionEnabled &&
            !isUserAuthenticated &&
            isBiometricsAuthenticationAllowed
        ) {
            doAuthentication();
        }
    }, [
        appStateVisible,
        isUserAuthenticated,
        isBiometricsOptionEnabled,
        isBiometricsAuthenticationAllowed,
        setIsUserAuthenticated,
        setIsBiometricsOverlayVisible,
        doAuthentication,
    ]);

    return { isBiometricsAuthenticationAllowed, requestAuthenticationCheck };
};
