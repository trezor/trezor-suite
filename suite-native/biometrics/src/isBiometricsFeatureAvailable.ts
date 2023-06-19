import { hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication';

export const getIsBiometricsFeatureAvailable = async () => {
    const isHardwareCompatible = await hasHardwareAsync();
    const areBiometricsEnabled = await isEnrolledAsync();

    return isHardwareCompatible && areBiometricsEnabled;
};
