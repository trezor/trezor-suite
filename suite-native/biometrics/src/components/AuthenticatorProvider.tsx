import React, { ReactNode, useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { BiometricOverlay } from './BiometricOverlay';
import { useIsUserAuthenticated, useIsBiometricsEnabled } from '../biometricsAtoms';

type AuthenticatorProviderProps = {
    children: ReactNode;
};

export const AuthenticatorProvider = ({ children }: AuthenticatorProviderProps) => {
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { isUserAuthenticated, setIsUserAuthenticated } = useIsUserAuthenticated();

    const handleAuthenticate = useCallback(async () => {
        if (Platform.OS === 'android') {
            // Cancel any previous authentication attempt.
            await LocalAuthentication.cancelAuthenticate();
        }

        const result = await LocalAuthentication.authenticateAsync();
        setIsUserAuthenticated(result.success);
    }, [setIsUserAuthenticated]);

    useEffect(() => {
        if (isBiometricsOptionEnabled && !isUserAuthenticated) {
            handleAuthenticate();
        }
    }, [handleAuthenticate, isBiometricsOptionEnabled, isUserAuthenticated]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                if (isBiometricsOptionEnabled && !isUserAuthenticated) {
                    handleAuthenticate();
                }
            } else {
                setIsUserAuthenticated(false);
            }
        });

        return () => subscription.remove();
    }, [
        handleAuthenticate,
        isBiometricsOptionEnabled,
        isUserAuthenticated,
        setIsUserAuthenticated,
    ]);

    return (
        <>
            {children}
            {isBiometricsOptionEnabled && !isUserAuthenticated && <BiometricOverlay />}
        </>
    );
};
