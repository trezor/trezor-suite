import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import {
    addSentryBreadcrumb,
    captureSentryException,
    captureSentryMessage,
} from '@suite-native/sentry';

import {
    useIsBiometricsEnabled,
    useIsBiometricsOverlayVisible,
    useIsUserAuthenticated,
} from './biometricsAtoms';
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';

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
        try {
            const result = await authenticate();

            addSentryBreadcrumb({
                category: 'biometrics',
                message: 'LocalAuthentication.authenticateAsync result received',
                data: {
                    authenticationResult: result,
                },
                level: result?.success ? 'info' : 'warning',
            });

            if (result?.success) {
                setIsUserAuthenticated(true);
                setIsBiometricsOverlayVisible(false);
            } else if (result?.error) {
                captureSentryMessage(`Biometrics attempt failed: ${result.error}`, {
                    level: 'warning',
                    tags: {
                        biometrics_error_code: result.error,
                    },
                });
            }
            setIsBiometricsAuthenticationAllowed(false);
        } catch (e) {
            captureSentryException(e, {
                tags: {
                    context: 'biometrics_authentication',
                },
            });
        }
    }, [setIsBiometricsOverlayVisible, setIsUserAuthenticated]);

    // Request authentication check whenever the authentication state changes
    // or when biometrics is enabled in settings (isBiometricsOptionEnabled)
    // and also when app state changes
    // and if auth allowance changes
    useEffect(() => {
        addSentryBreadcrumb({
            category: 'biometrics',
            message: 'Biometrics check useEffect triggered',
            data: {
                appState: appState.current,
                isOptionEnabled: isBiometricsOptionEnabled,
                isAuthenticated: isUserAuthenticated,
                isAllowed: isBiometricsAuthenticationAllowed,
            },
            level: 'info',
        });
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
            addSentryBreadcrumb({
                category: 'biometrics',
                message: 'Calling doAuthentication() based on useEffect conditions',
                level: 'info',
            });
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
