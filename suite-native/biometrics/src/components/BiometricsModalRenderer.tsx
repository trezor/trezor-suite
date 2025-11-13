import { useSelector } from 'react-redux';

import { useBiometrics } from '../useBiometrics';
import { BiometricOverlay } from './BiometricOverlay';
import { selectBiometricsError, selectIsBiometricsOverlayVisible } from '../biometricsSlice';

export const BiometricsModalRenderer = () => {
    const isBiometricsOverlayVisible = useSelector(selectIsBiometricsOverlayVisible);
    const biometricsError = useSelector(selectBiometricsError);

    const { doAuthentication } = useBiometrics();

    return isBiometricsOverlayVisible ? (
        <BiometricOverlay
            isBiometricsAuthButtonVisible={!!biometricsError}
            onBiometricAuthPress={doAuthentication}
        />
    ) : null;
};
