import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import { useAlert } from '@suite-native/alerts';

import { useIsBiometricsEnabled } from './biometricsAtoms';
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';

export const useBiometrics = () => {
    const { showAlert, hideAlert } = useAlert();
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
            console.log('result', result);

            if (
                !result.success &&
                (result.error === 'user_cancel' ||
                    result.error === 'system_cancel' ||
                    result.error.startsWith('unknown'))
            ) {
                // setIsUserAuthenticated(false);
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
            } else {
                setIsUserAuthenticated(result.success);
                hideAlert();
                return result;
            }
        } catch (e) {
            console.log(e);
            return { success: false };
        }
    }, [hideAlert, showAlert]);

    const toggleBiometricsOption = useCallback(async () => {
        const isBiometricsOnDevice = await getIsBiometricsFeatureAvailable();

        if (isBiometricsOnDevice) {
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
                    await authenticate();
                };
                auth();
            }
            if (nextAppState === 'background') {
                console.log('set false');
                setIsUserAuthenticated(false);
            }
        });

        return () => subscription.remove();
    }, [authenticate, isBiometricsOptionEnabled, isUserAuthenticated, setIsUserAuthenticated]);

    useEffect(() => {
        if (isBiometricsOptionEnabled && !isUserAuthenticated) {
            const auth = async () => {
                await authenticate();
            };
            auth();
        }
    }, [authenticate, isBiometricsOptionEnabled, isUserAuthenticated]);

    return { toggleBiometricsOption, isUserAuthenticated };
};
