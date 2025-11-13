import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isRejected } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';

import {
    authenticate,
    selectIsBiometricsEnabled,
    setIsBiometricsOverlayVisible,
    setIsUserAuthenticated,
    toggleEnableBiometrics,
} from './biometricsSlice';

export type BiometricsToggleResult = 'enabled' | 'disabled' | 'failed' | 'notAvailable';

export const useBiometricsSettings = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const isBiometricsEnabled = useSelector(selectIsBiometricsEnabled);
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const toggleBiometricsOption = useCallback(async (): Promise<BiometricsToggleResult> => {
        const authResult = await dispatch(authenticate());

        if (isRejected(authResult) && authResult.payload === 'biometrics-not-available') {
            await new Promise(resolve => {
                showAlert({
                    title: 'Biometrics',
                    description:
                        'No security features on your device. Make sure you have biometrics setup on your phone and try again.',
                    primaryButtonTitle: 'Cancel',
                    onPressPrimaryButton: () => resolve(undefined),
                    pictogramVariant: 'warning',
                });
            });

            return 'notAvailable';
        }

        if (isRejected(authResult) || !authResult.payload?.success) {
            return 'failed';
        }

        dispatch(setIsBiometricsOverlayVisible(false));

        if (isBiometricsEnabled) {
            dispatch(toggleEnableBiometrics(false));
            dispatch(setIsUserAuthenticated(false));
            analytics.report({
                type: events.biometricsChangeEvent.name,
                payload: { enabled: false, origin: 'settingsToggle' },
            });

            return 'disabled';
        }

        dispatch(setIsUserAuthenticated(true));
        dispatch(toggleEnableBiometrics(true));
        analytics.report({
            type: events.biometricsChangeEvent.name,
            payload: { enabled: true, origin: 'settingsToggle' },
        });

        return 'enabled';
    }, [analytics, showAlert, dispatch, isBiometricsEnabled]);

    return { toggleBiometricsOption };
};
