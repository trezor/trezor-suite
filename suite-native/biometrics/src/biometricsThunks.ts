import { AppStateStatus, Platform } from 'react-native';

import { isRejected } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import { LocalAuthenticationResult } from 'expo-local-authentication';

import { createThunk } from '@suite-common/redux-utils';
import { EventType, analytics } from '@suite-native/analytics';

import {
    changeGoneToBackgroundAtTimestamp,
    selectGoneToBackgroundAtTimestamp,
    selectIsBiometricsEnabled,
    selectIsTogglingBiometrics,
    selectShouldUserBeAuthenticated,
    setIsUserAuthenticated,
    toggleEnableBiometrics,
} from './biometricsSlice';
import { getIsBiometricsFeatureAvailable, getShouldRevokeAuth } from './biometricsUtils';

const BIOMETRICS_THUNK_PREFIX = 'biometrics';

export enum AuthenticateError {
    BiometricsNotAvailable = 'biometrics-not-available',
    AuthenticationFailed = 'authentication-failed',
}

export const authenticateUserThunk = createThunk<
    LocalAuthenticationResult,
    void,
    {
        rejectValue: AuthenticateError;
    }
>(`${BIOMETRICS_THUNK_PREFIX}/authenticate`, async (_, { rejectWithValue, dispatch }) => {
    const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

    if (!isBiometricsAvailable) return rejectWithValue(AuthenticateError.BiometricsNotAvailable);

    const result = await LocalAuthentication.authenticateAsync();

    if (!result.success) {
        return rejectWithValue(AuthenticateError.AuthenticationFailed);
    }

    dispatch(setIsUserAuthenticated(true));

    return result;
});

export type BiometricsToggleResult = 'enabled' | 'disabled';

export const toggleBiometricsSettingsThunk = createThunk<
    BiometricsToggleResult,
    void,
    { rejectValue: AuthenticateError }
>(
    `${BIOMETRICS_THUNK_PREFIX}/toggleBiometricsSettings`,
    async (_, { getState, rejectWithValue, dispatch }) => {
        const authResult = await dispatch(authenticateUserThunk());

        if (isRejected(authResult) && authResult.payload) {
            return rejectWithValue(authResult.payload);
        }

        const isBiometricsEnabled = selectIsBiometricsEnabled(getState());

        if (isBiometricsEnabled) {
            dispatch(toggleEnableBiometrics(false));
            analytics.report({
                type: EventType.BiometricsChange,
                payload: { enabled: false, origin: 'settingsToggle' },
            });

            return 'disabled';
        } else {
            dispatch(toggleEnableBiometrics(true));
            analytics.report({
                type: EventType.BiometricsChange,
                payload: { enabled: true, origin: 'settingsToggle' },
            });

            return 'enabled';
        }
    },
);
export const handleBiometricsAppStateChangeThunk = createThunk(
    `${BIOMETRICS_THUNK_PREFIX}/handleAppStateChange`,
    ({ currentAppState }: { currentAppState: AppStateStatus }, { getState, dispatch }) => {

        const goneToBackgroundAtTimestamp = selectGoneToBackgroundAtTimestamp(getState());
        const shouldUserBeAuthenticated = selectShouldUserBeAuthenticated(getState());
        const isTogglingBiometricsInProgress = selectIsTogglingBiometrics(getState());

        const shouldRevokeAuth = getShouldRevokeAuth(goneToBackgroundAtTimestamp);

        switch (currentAppState) {
            case 'active':
                if (shouldRevokeAuth && shouldUserBeAuthenticated) {
                    dispatch(authenticateUserThunk());
                } else if (!shouldRevokeAuth) {
                    dispatch(setIsUserAuthenticated(true));
                }
                break;

            case 'background':
                // Stop the authentication flow if user leaves the app.
                if (Platform.OS === 'android' && isBiometricsOptionEnabled) {
                    LocalAuthentication.cancelAuthenticate();
                }
                dispatch(setIsUserAuthenticated(false));
                dispatch(changeGoneToBackgroundAtTimestamp(Date.now()));
                break;

            case 'inactive':
                // This will prevent displaying the biometrics overlay when toggling biometrics settings
                if (!isTogglingBiometricsInProgress) {
                    dispatch(setIsUserAuthenticated(false));
                }
                dispatch(changeGoneToBackgroundAtTimestamp(Date.now()));
                break;

            default:
                return;
        }
    },
);
