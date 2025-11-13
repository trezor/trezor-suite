import { useCallback, useEffect, useRef } from 'react';
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
const KEEP_LOGGED_IN_TIMEOUT = 3_000;

export const useBiometrics = () => {
    const dispatch = useDispatch();
    const isAuthenticatingRef = useRef(false);
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);

    const appState = useRef(AppState.currentState);
    const goneToBackgroundAtTimestamp = useRef<null | number>(null);

    const isUserAuthenticated = useSelector(selectIsUserAuthenticated);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);

    const cancelAndroidAuth = useCallback(() => {
        if (Platform.OS === 'android' && isBiometricsOptionEnabled) {
            LocalAuthentication.cancelAuthenticate();
        }
    }, [isBiometricsOptionEnabled]);

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
        }
    }, [dispatch]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            // console.log('handleAppStateChange#1', nextAppState);
            switch (nextAppState) {
                case 'active':
                    if (
                        // Revoke user authentication if the timeout has run out.
                        appState.current === 'background' &&
                        goneToBackgroundAtTimestamp.current &&
                        goneToBackgroundAtTimestamp.current < Date.now() - KEEP_LOGGED_IN_TIMEOUT
                    ) {
                        // console.log('handleAppStateChange#2', nextAppState);
                        dispatch(setIsUserAuthenticated(false));
                        doAuthentication();
                    } else if (isUserAuthenticated) {
                        // console.log('handleAppStateChange#3', nextAppState);
                        dispatch(setIsBiometricsOverlayVisible(false));
                    } else if (shouldUserBeAuthenticated) {
                        // console.log('handleAppStateChange#4', nextAppState);
                        dispatch(setIsUserAuthenticated(false));
                        doAuthentication();
                    }
                    break;

                case 'background':
                    cancelAndroidAuth();
                    dispatch(setIsBiometricsOverlayVisible(true));
                    goneToBackgroundAtTimestamp.current = Date.now();
                    break;

                case 'inactive':
                    cancelAndroidAuth();
                    dispatch(setIsBiometricsOverlayVisible(true));
                    break;

                default:
                    return;
            }
            appState.current = nextAppState;
        };

        // Authentication on mount
        handleAppStateChange(AppState.currentState);

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => subscription.remove();
    }, [
        isBiometricsOptionEnabled,
        isUserAuthenticated,
        dispatch,
        cancelAndroidAuth,
        doAuthentication,
        shouldUserBeAuthenticated,
    ]);

    return { doAuthentication };
};
