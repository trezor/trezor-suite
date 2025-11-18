import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import * as LocalAuthentication from 'expo-local-authentication';

import {
    selectIsAuthenticating,
    selectIsBiometricsEnabled,
    selectIsTogglingBiometrics,
    selectShouldUserBeAuthenticated,
    setIsUserAuthenticated,
} from './biometricsSlice';
import { authenticateUserThunk } from './biometricsThunks';
import { getShouldRevokeAuth } from './biometricsUtils';

export const useBiometrics = () => {
    const dispatch = useDispatch();
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);

    const isAuthenticating = useSelector(selectIsAuthenticating);
    const isTogglingBiometricsInProgress = useSelector(selectIsTogglingBiometrics);
    const previousAppState = useRef(AppState.currentState);
    const goneToBackgroundAtTimestamp = useRef<null | number>(null);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);

    const cancelAndroidAuth = useCallback(() => {
        if (Platform.OS === 'android' && isBiometricsOptionEnabled) {
            LocalAuthentication.cancelAuthenticate();
        }
    }, [isBiometricsOptionEnabled]);

    const handleBiometricsAppStateChange = useCallback(
        (nextAppState: AppStateStatus) => {
            if (!isBiometricsOptionEnabled) {
                return;
            }

            const shouldRevokeAuth = getShouldRevokeAuth(goneToBackgroundAtTimestamp.current);

            switch (nextAppState) {
                case 'active':
                    if (shouldRevokeAuth && shouldUserBeAuthenticated && !isAuthenticating) {
                        dispatch(authenticateUserThunk());
                    } else if (!shouldRevokeAuth) {
                        dispatch(setIsUserAuthenticated(true));
                    }
                    break;

                case 'background':
                    // Stop the authentication flow if user leaves the app.
                    cancelAndroidAuth();
                    dispatch(setIsUserAuthenticated(false));
                    goneToBackgroundAtTimestamp.current = Date.now();
                    break;

                case 'inactive':
                    // This will prevent displaying the biometrics overlay when toggling biometrics settings
                    if (previousAppState.current === 'active' && !isTogglingBiometricsInProgress) {
                        dispatch(setIsUserAuthenticated(false));
                    }
                    break;

                default:
                    return;
            }

            previousAppState.current = nextAppState;
        },
        [
            cancelAndroidAuth,
            dispatch,
            isAuthenticating,
            isBiometricsOptionEnabled,
            isTogglingBiometricsInProgress,
            shouldUserBeAuthenticated,
        ],
    );

    useEffect(() => {
        // Authentication on mount
        handleBiometricsAppStateChange(AppState.currentState);

        const subscription = AppState.addEventListener('change', handleBiometricsAppStateChange);

        return () => subscription.remove();
    }, [handleBiometricsAppStateChange]);

    return { handleBiometricsAppStateChange };
};
