import * as LocalAuthentication from 'expo-local-authentication';

export const getIsBiometricsFeatureAvailable = async () => {
    const enrolledLevelAsync = await LocalAuthentication.getEnrolledLevelAsync();
    return enrolledLevelAsync !== LocalAuthentication.SecurityLevel.NONE;
};
