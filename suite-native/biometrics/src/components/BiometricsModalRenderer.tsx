import { useSelector } from 'react-redux';

import { useBiometrics } from '../useBiometrics';
import { BiometricOverlay } from './BiometricOverlay';
import { selectIsBiometricsOverlayVisible } from '../biometricsSlice';

export const BiometricsModalRenderer = () => {
    const isBiometricsOverlayVisible = useSelector(selectIsBiometricsOverlayVisible);
    const { isBiometricsAuthenticationAllowed, requestAuthenticationCheck } = useBiometrics();

    return isBiometricsOverlayVisible ? (
        <BiometricOverlay
            isBiometricsAuthButtonVisible={!isBiometricsAuthenticationAllowed}
            onBiometricAuthPress={requestAuthenticationCheck}
        />
    ) : null;
};
