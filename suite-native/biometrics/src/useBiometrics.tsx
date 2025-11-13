import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import * as LocalAuthentication from 'expo-local-authentication';

import {
    selectIsBiometricsEnabled,
    selectIsUserAuthenticated,
    selectShouldUserBeAuthenticated,
    setIsBiometricsOverlayVisible,
    setIsUserAuthenticated,
} from './biometricsSlice';
import { authenticate } from './biometricsThunks';

/**
 * The time period for which is user not asked to be authenticated again if returns back to the app.
 */
const KEEP_LOGGED_IN_TIMEOUT = 30_000;

export const useBiometrics = () => {
    const dispatch = useDispatch();
    const isAuthenticatingRef = useRef(false);
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);

    const [shouldAutoAuthenticate, setShouldAutoAuthenticate] = useState(true);

    // Keeps track of the current AppState - not only needed for biometrics, but useful for it
    const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);
    const appState = useRef(AppState.currentState);
    const goneToBackgroundAtTimestamp = useRef<null | number>(null);

    const isUserAuthenticated = useSelector(selectIsUserAuthenticated);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);

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
                    setShouldAutoAuthenticate(true);
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
    }, [isBiometricsOptionEnabled, setShouldAutoAuthenticate, isUserAuthenticated, dispatch]);

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
            isAuthenticatingRef.current = false;
            setShouldAutoAuthenticate(false);
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

        if (shouldUserBeAuthenticated && shouldAutoAuthenticate) {
            doAuthentication();
        }
    }, [
        shouldUserBeAuthenticated,
        appStateVisible,
        isBiometricsOptionEnabled,
        shouldAutoAuthenticate,
        doAuthentication,
    ]);

    return { shouldAutoAuthenticate, doAuthentication };
};
