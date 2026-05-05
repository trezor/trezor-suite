import { SecurityLevel, getEnrolledLevelAsync } from 'expo-local-authentication';

// The time period for which user is not asked to be authenticated again if he returns back to the app.
const KEEP_LOGGED_IN_TIMEOUT = 30_000;

export const getIsBiometricsFeatureAvailable = async () => {
    const enrolledLevelAsync = await getEnrolledLevelAsync();

    return enrolledLevelAsync !== SecurityLevel.NONE;
};

// Revoke user authentication if the timeout has run out.
export const getShouldRevokeAuth = (goneToBackgroundAtTimestamp: number | null) =>
    goneToBackgroundAtTimestamp === null ||
    goneToBackgroundAtTimestamp < Date.now() - KEEP_LOGGED_IN_TIMEOUT;
