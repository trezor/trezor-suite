import { AppStateStatus } from 'react-native';

import { SecurityLevel, getEnrolledLevelAsync } from 'expo-local-authentication';

// The time period for which is user not asked to be authenticated again if returns back to the app.
const KEEP_LOGGED_IN_TIMEOUT = 3_000;

export const getIsBiometricsFeatureAvailable = async () => {
    const enrolledLevelAsync = await getEnrolledLevelAsync();

    return enrolledLevelAsync !== SecurityLevel.NONE;
};

// Revoke user authentication if the timeout has run out.
export const shouldRevokeAuth = (
    appState: AppStateStatus,
    goneToBackgroundAtTimestamp: number | null,
) =>
    appState === 'background' &&
    goneToBackgroundAtTimestamp &&
    goneToBackgroundAtTimestamp < Date.now() - KEEP_LOGGED_IN_TIMEOUT;
