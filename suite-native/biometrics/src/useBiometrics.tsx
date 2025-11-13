import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import * as LocalAuthentication from 'expo-local-authentication';

import {
    authenticate,
    selectIsBiometricsEnabled,
    selectIsUserAuthenticated,
    setIsBiometricsOverlayVisible,
    setIsUserAuthenticated,
} from './biometricsSlice';

/**
 * The time period for which is user not asked to be authenticated again if returns back to the app.
 */
const KEEP_LOGGED_IN_TIMEOUT = 30_000;

export const useBiometrics = () => {
    const dispatch = useDispatch();

    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);
    const isAuthenticatingRef = useRef(false);

    const [isBiometricsAuthenticationAllowed, setIsBiometricsAuthenticationAllowed] =
        useState(true);

    // Keeps track of the current AppState - not only needed for biometrics, but useful for it
    const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);
    const appState = useRef(AppState.currentState);
    const goneToBackgroundAtTimestamp = useRef<null | number>(null);

    const isUserAuthenticated = useSelector(selectIsUserAuthenticated);

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
                        dispatch(setIsUserAuthenticated(false));
                    } else if (isUserAuthenticated) {
                        dispatch(setIsBiometricsOverlayVisible(false));
                    }
                    break;

                case 'background':
                    dispatch(setIsBiometricsOverlayVisible(true));
                    setIsBiometricsAuthenticationAllowed(true);
                    goneToBackgroundAtTimestamp.current = Date.now();
                    break;

                case 'inactive':
                    dispatch(setIsBiometricsOverlayVisible(true));
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
        setIsBiometricsAuthenticationAllowed,
        isUserAuthenticated,
        dispatch,
    ]);

    const requestAuthenticationCheck = () => setIsBiometricsAuthenticationAllowed(true);

    const doAuthentication = useCallback(async () => {
        if (isAuthenticatingRef.current) return;
        isAuthenticatingRef.current = true;

        try {
            const result = await dispatch(authenticate()).unwrap();

            if (result?.success) {
                dispatch(setIsUserAuthenticated(true));
                dispatch(setIsBiometricsOverlayVisible(false));
            }
        } finally {
            setIsBiometricsAuthenticationAllowed(false);
            isAuthenticatingRef.current = false;
        }
    }, [dispatch]);

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
        doAuthentication,
    ]);

    return { isBiometricsAuthenticationAllowed, requestAuthenticationCheck };
};
