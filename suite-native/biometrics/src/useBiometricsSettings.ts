import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts/src';
import { analytics, EventType } from '@suite-native/analytics';

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

    const toggleBiometricsOption = useCallback(async (): Promise<BiometricsToggleResult> => {
        const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

        if (!isBiometricsAvailable) {
            showAlert({
                title: 'Biometrics',
                description:
                    'No security features on your device. Make sure you have biometrics setup on your phone and try again.',
                primaryButtonTitle: 'Cancel',
                onPressPrimaryButton: () => null,
                icon: 'warningCircle',
                pictogramVariant: 'yellow',
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
            analytics.report({
                type: EventType.SettingsBiometricsToggle,
                payload: { enabled: false },
            });
            return 'disabled';
        }

        setIsUserAuthenticated(true);
        setIsBiometricsOptionEnabled(true);
        analytics.report({
            type: EventType.SettingsBiometricsToggle,
            payload: { enabled: true },
        });
        return 'enabled';
    }, [
        isBiometricsOptionEnabled,
        setIsBiometricsOptionEnabled,
        setIsBiometricsOverlayVisible,
        setIsUserAuthenticated,
        showAlert,
    ]);
    return { toggleBiometricsOption };
};
