import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';
import { useAlert } from '@suite-native/alerts';
import { analytics, EventType } from '@suite-native/analytics';

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

            if (
                !result.success &&
                (result.error === 'user_cancel' ||
                    result.error === 'system_cancel' ||
                    // Sometimes the native code returns some unknown error that we need to handle as well so we give user option to try again.
                    result.error.startsWith('unknown'))
            ) {
                showAlert({
                    title: 'Authentication canceled',
                    description: 'You will have to try again.',
                    pictogramVariant: 'red',
                    icon: 'warningCircle',
                    onPressPrimaryButton: authenticate,
                    primaryButtonTitle: 'Try again',
                    secondaryButtonTitle: 'Cancel',
                    onPressSecondaryButton: () => null,
                });
            } else {
                setIsUserAuthenticated(result.success);
                hideAlert(); // Hide alert if previous attempts failed but there is a new succesfull attempt underway
                return result;
            }
        } catch (e) {
            return { success: false };
        }
    }, [hideAlert, showAlert]);

    const toggleBiometricsOption = useCallback(async () => {
        const isBiometricsOnDevice = await getIsBiometricsFeatureAvailable();

        if (isBiometricsOnDevice) {
            const result = await authenticate();
            if (result?.success) {
                setIsBiometricsOptionEnabled(!isBiometricsOptionEnabled);
                analytics.report({
                    type: EventType.SettingsBiometricsToggle,
                    payload: { enabled: !isBiometricsOptionEnabled },
                });
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

    return { toggleBiometricsOption, isUserAuthenticated, isBiometricsOptionEnabled };
};
