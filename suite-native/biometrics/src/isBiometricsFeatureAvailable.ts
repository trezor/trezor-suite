import { getEnrolledLevelAsync, SecurityLevel } from 'expo-local-authentication';

export const getIsBiometricsFeatureAvailable = async () => {
    const enrolledLevelAsync = await getEnrolledLevelAsync();

    return enrolledLevelAsync !== SecurityLevel.NONE;
};
