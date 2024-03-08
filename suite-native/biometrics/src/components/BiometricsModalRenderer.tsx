import { useIsBiometricsOverlayVisible } from '../biometricsAtoms';
import { useBiometrics } from '../useBiometrics';
import { BiometricOverlay } from './BiometricOverlay';

export const BiometricsModalRenderer = () => {
    const { isBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();
    const { isBiometricsAuthenticationAllowed, requestAuthenticationCheck } = useBiometrics();

    return isBiometricsOverlayVisible ? (
        <BiometricOverlay
            isBiometricsAuthButtonVisible={!isBiometricsAuthenticationAllowed}
            onBiometricAuthPress={requestAuthenticationCheck}
        />
    ) : null;
};
