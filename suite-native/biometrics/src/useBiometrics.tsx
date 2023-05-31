import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { useAlert } from '@suite-native/alerts';

import { useIsBiometricsEnabled, useIsUserAuthenticated } from './biometricsAtoms';
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';

export const useBiometrics = () => {
    const { showAlert } = useAlert();
    const { isBiometricsOptionEnabled, setIsBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

    const authenticate = useCallback(async () => {
        if (Platform.OS === 'android') {
            // Cancel any previous authentication attempt. (Only available for android)
            await LocalAuthentication.cancelAuthenticate();
        }

        if (AppState.currentState !== 'active') return;

        try {
            const result = await LocalAuthentication.authenticateAsync();
            setIsUserAuthenticated(result.success);
            console.log('result', result);

            if (
                !result.success &&
                (result.error === 'user_cancel' ||
                    result.error === 'system_cancel' ||
                    result.error.startsWith('unknown'))
            ) {
                showAlert({
                    title: 'Authentication canceled',
                    description: 'You will have to try again.',
                    pictogramVariant: 'red',
                    icon: 'warningCircle',
                    onPressPrimaryButton: authenticate, // TODO test this
                    primaryButtonTitle: 'Try again',
                    secondaryButtonTitle: 'Cancel',
                    onPressSecondaryButton: () => null,
                });
            }

            return result;
        } catch (e) {
            console.log(e);
        }
    }, [setIsUserAuthenticated, showAlert]);

    const toggleBiometricsOption = useCallback(async () => {
        const isBiometricsOnDevice = await getIsBiometricsFeatureAvailable();

        if (isBiometricsOnDevice) {
            console.log('call from toggle');
            const result = await authenticate();
            if (result?.success) {
                setIsBiometricsOptionEnabled(!isBiometricsOptionEnabled);
            }
        } else {
            showAlert({
                title: 'Biometrics',
                description:
                    'No security features on your device. Make sure you have biometrics setup on your phone and try again.',
                primaryButtonTitle: 'Cancel',
                onPressPrimaryButton: () => null,
                icon: 'warningCircle',
                pictogramVariant: 'yellow',
            });
        }
    }, [authenticate, isBiometricsOptionEnabled, setIsBiometricsOptionEnabled, showAlert]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active' && isBiometricsOptionEnabled && !isUserAuthenticated) {
                const auth = async () => {
                    console.log('call from app state');
                    await authenticate();
                };
                auth();
            }
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                console.log('set false');
                setIsUserAuthenticated(false);
            }
        });

        return () => subscription.remove();
    }, [authenticate, isBiometricsOptionEnabled, isUserAuthenticated, setIsUserAuthenticated]);

    return { handleAuthenticate: authenticate, toggleBiometricsOption, isUserAuthenticated };
};
