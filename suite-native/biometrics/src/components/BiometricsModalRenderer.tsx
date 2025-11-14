import { useSelector } from 'react-redux';

import { useBiometrics } from '../useBiometrics';
import { BiometricOverlay } from './BiometricOverlay';
import { selectBiometricsError, selectShouldUserBeAuthenticated } from '../biometricsSlice';

export const BiometricsModalRenderer = () => {
    const biometricsError = useSelector(selectBiometricsError);
    const shouldUserBeAuthenticated = useSelector(selectShouldUserBeAuthenticated);

    const { doAuthentication } = useBiometrics();

    return shouldUserBeAuthenticated ? (
        <BiometricOverlay
            isBiometricsAuthButtonVisible={!!biometricsError}
            onBiometricAuthPress={doAuthentication}
        />
    ) : null;
};
