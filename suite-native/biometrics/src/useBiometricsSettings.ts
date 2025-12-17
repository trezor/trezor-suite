import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';
import { EventType } from '@suite-native/analytics';
import { useLegacyAnalytics } from '@suite-native/services';

import {
    useIsBiometricsEnabled,
    useIsBiometricsOverlayVisible,
    useIsUserAuthenticated,
} from './biometricsAtoms';
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';
import { authenticate } from './useBiometrics';

export type BiometricsToggleResult = 'enabled' | 'disabled' | 'failed' | 'notAvailable';

export const useBiometricsSettings = () => {
    const { showAlert } = useAlert();
    const { setIsUserAuthenticated } = useIsUserAuthenticated();
    const { isBiometricsOptionEnabled, setIsBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { setIsBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();
    const legacyAnalytics = useLegacyAnalytics();
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

        const authResult = await authenticate();

        if (!authResult?.success) {
            return 'failed';
        }

        setIsBiometricsOverlayVisible(false);

        if (isBiometricsOptionEnabled) {
            setIsBiometricsOptionEnabled(false);
            setIsUserAuthenticated(false);
            legacyAnalytics.report({
                type: EventType.BiometricsChange,
                payload: { enabled: false, origin: 'settingsToggle' },
            });

            return 'disabled';
        }

        setIsUserAuthenticated(true);
        setIsBiometricsOptionEnabled(true);
        legacyAnalytics.report({
            type: EventType.BiometricsChange,
            payload: { enabled: true, origin: 'settingsToggle' },
        });

        return 'enabled';
    }, [
        isBiometricsOptionEnabled,
        legacyAnalytics,
        setIsBiometricsOptionEnabled,
        setIsBiometricsOverlayVisible,
        setIsUserAuthenticated,
        showAlert,
    ]);

    return { toggleBiometricsOption };
};
