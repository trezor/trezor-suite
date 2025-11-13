import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';

export type BiometricsToggleResult = 'enabled' | 'disabled' | 'failed' | 'notAvailable';

export const useBiometricsSettings = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const isBiometricsEnabled = useSelector(selectIsBiometricsEnabled);
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const toggleBiometricsOption = useCallback(async (): Promise<BiometricsToggleResult> => {
        const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

        if (!isBiometricsAvailable) {
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

        const authResult = await dispatch(authenticate()).unwrap();

        if (!authResult?.success) {
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
    }, [
        analytics,
        showAlert,
        dispatch,
        isBiometricsEnabled,
    ]);

    return { toggleBiometricsOption };
};
