import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import * as LocalAuthentication from 'expo-local-authentication';

import {
    selectIsBiometricsEnabled,
    selectIsTogglingBiometrics,
    selectIsUserAuthenticated,
    selectShouldUserBeAuthenticated,
    setIsUserAuthenticated,
} from './biometricsSlice';
import { authenticate } from './biometricsThunks';
import { shouldRevokeAuth } from './biometricsUtils';

export const useBiometrics = () => {
    const dispatch = useDispatch();
    const isBiometricsOptionEnabled = useSelector(selectIsBiometricsEnabled);
    const isTogglingBiometrics = useSelector(selectIsTogglingBiometrics);

    // TODO can this be changed so that it's done same as settings toggling
    const isAuthenticatingRef = useRef(false);
    // TODO do we need this or can it be replaced with AppState.currentState directly?
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
            await dispatch(authenticate());
        } finally {
            isAuthenticatingRef.current = false;
        }
    }, [dispatch]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            const revokeAuth = shouldRevokeAuth(
                appState.current,
                goneToBackgroundAtTimestamp.current,
            );

            switch (nextAppState) {
                case 'active':
                    if (revokeAuth && shouldUserBeAuthenticated && !isAuthenticatingRef.current) {
                        doAuthentication();
                    } else if (!revokeAuth) {
                        dispatch(setIsUserAuthenticated(true));
                    }
                    break;

                case 'background':
                    cancelAndroidAuth();
                    dispatch(setIsUserAuthenticated(false));
                    goneToBackgroundAtTimestamp.current = Date.now();
                    break;

                case 'inactive':
                    // TODO iOS state only - could be removed
                    cancelAndroidAuth();
                    if (
                        !isAuthenticatingRef.current &&
                        !isTogglingBiometrics &&
                        appState.current === 'active'
                    ) {
                        dispatch(setIsUserAuthenticated(false));
                    }
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
        cancelAndroidAuth,
        dispatch,
        doAuthentication,
        isTogglingBiometrics,
        isUserAuthenticated,
        shouldUserBeAuthenticated,
    ]);

    return { doAuthentication };
};
