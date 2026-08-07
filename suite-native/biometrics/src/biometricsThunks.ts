import { type AppStateStatus, Platform } from 'react-native';

import { isRejected } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import type { LocalAuthenticationResult } from 'expo-local-authentication';

import { createThunk } from '@suite-common/redux-utils';
import { type NativeAnalyticsDep, asTypedNativeAnalytics, events } from '@suite-native/analytics';

import {
    selectGoneToBackgroundAtTimestamp,
    selectIsBiometricsEnabled,
    selectIsTogglingBiometrics,
    selectIsUserAuthenticated,
    selectShouldUserBeAuthenticated,
} from './biometricsSelectors';
import { getIsBiometricsFeatureAvailable, getShouldRevokeAuth } from './biometricsUtils';
import { AuthenticateError, type BiometricsSliceRootState } from './types';

export enum BiometricsToggleResult {
    Enabled = 'enabled',
    Disabled = 'disabled',
    BiometricsNotAvailable = 'biometrics-not-available',
}

export type BiometricsToggleFulfilledResult = Extract<
    BiometricsToggleResult,
    BiometricsToggleResult.Enabled | BiometricsToggleResult.Disabled
>;

type BiometricsToggleRejectReason =
    | BiometricsToggleResult.BiometricsNotAvailable
    | AuthenticateError;

export type BiometricsAppStateChangePayload = {
    isUserAuthenticated?: boolean;
    goneToBackgroundAtTimestamp?: number | null;
};

type BiometricsAppStateChangeRejectReason = 'biometrics-disabled' | 'unhandled-app-state';

const BIOMETRICS_THUNK_PREFIX = 'biometrics';

export const authenticateUserThunk = createThunk<
    LocalAuthenticationResult,
    void,
    { rejectValue: AuthenticateError; state: void }
>(`${BIOMETRICS_THUNK_PREFIX}/authenticate`, async (_, { rejectWithValue }) => {
    const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

    if (!isBiometricsAvailable) {
        return rejectWithValue(AuthenticateError.BiometricsNotAvailable);
    }

    const result = await LocalAuthentication.authenticateAsync();

    if (!result.success) {
        return rejectWithValue(AuthenticateError.AuthenticationFailed);
    }

    return result;
});

type ToggleBiometricsSettingsThunkState = BiometricsSliceRootState;
type ToggleBiometricsSettingsThunkDeps = { services: NativeAnalyticsDep };

export const toggleBiometricsSettingsThunk = createThunk<
    BiometricsToggleFulfilledResult,
    void,
    {
        rejectValue: BiometricsToggleRejectReason;
        state: ToggleBiometricsSettingsThunkState;
        extra: ToggleBiometricsSettingsThunkDeps;
    }
>(
    `${BIOMETRICS_THUNK_PREFIX}/toggleBiometricsSettings`,
    async (_, { getState, rejectWithValue, dispatch, extra }) => {
        const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();
        const { services } = extra;

        if (!isBiometricsAvailable) {
            return rejectWithValue(BiometricsToggleResult.BiometricsNotAvailable);
        }

        const authResult = await dispatch(authenticateUserThunk());

        if (isRejected(authResult) && authResult.payload) {
            return rejectWithValue(authResult.payload);
        }

        const isBiometricsEnabled = selectIsBiometricsEnabled(getState());

        if (isBiometricsEnabled) {
            asTypedNativeAnalytics(services.analytics).report({
                type: events.biometricsChangeEvent.name,
                payload: { enabled: false, origin: 'settingsToggle' },
            });

            return BiometricsToggleResult.Disabled;
        }

        asTypedNativeAnalytics(services.analytics).report({
            type: events.biometricsChangeEvent.name,
            payload: { enabled: true, origin: 'settingsToggle' },
        });

        return BiometricsToggleResult.Enabled;
    },
);

type HandleBiometricsAppStateChangeThunkState = BiometricsSliceRootState;

export const handleBiometricsAppStateChangeThunk = createThunk<
    BiometricsAppStateChangePayload | undefined,
    { nextAppState: AppStateStatus },
    {
        rejectValue: BiometricsAppStateChangeRejectReason;
        state: HandleBiometricsAppStateChangeThunkState;
    }
>(
    `${BIOMETRICS_THUNK_PREFIX}/handleAppStateChange`,
    ({ nextAppState }, { getState, dispatch, rejectWithValue }) => {
        const goneToBackgroundAtTimestamp = selectGoneToBackgroundAtTimestamp(getState());
        const shouldUserBeAuthenticated = selectShouldUserBeAuthenticated(getState());
        const isTogglingBiometricsInProgress = selectIsTogglingBiometrics(getState());
        const isBiometricsOptionEnabled = selectIsBiometricsEnabled(getState());
        const isUserAuthenticated = selectIsUserAuthenticated(getState());
        const shouldRevokeAuth = getShouldRevokeAuth(goneToBackgroundAtTimestamp);
        // Keep the first timestamp for one background session so repeated inactive/background
        // events do not extend the keep-logged-in window.
        const newGoneToBackgroundAtTimestamp = isUserAuthenticated
            ? Date.now()
            : goneToBackgroundAtTimestamp;

        if (!isBiometricsOptionEnabled) {
            return rejectWithValue('biometrics-disabled');
        }

        switch (nextAppState) {
            case 'active':
                // Returning to the foreground within the keep-logged-in window: restore prior auth.
                // This should only be executed if user has been previously authenticated, which is controlled by the goneToBackgroundAtTimestamp.
                if (!shouldRevokeAuth) {
                    return { isUserAuthenticated: true };
                }

                if (shouldUserBeAuthenticated) {
                    // Cold start or returning after the keep-logged-in window: prompt the user.
                    dispatch(authenticateUserThunk());
                }

                return;

            case 'background':
                // Stop the authentication flow if user leaves the app on Android.
                if (Platform.OS === 'android' && isBiometricsOptionEnabled) {
                    LocalAuthentication.cancelAuthenticate();
                }

                return {
                    isUserAuthenticated: false,
                    goneToBackgroundAtTimestamp: newGoneToBackgroundAtTimestamp,
                };

            case 'inactive':
                if (isTogglingBiometricsInProgress) {
                    // Native biometrics prompt moves the app to inactive while toggling from settings.
                    // Keep the current authentication state and only refresh the background timestamp.
                    return { goneToBackgroundAtTimestamp: newGoneToBackgroundAtTimestamp };
                }

                return {
                    isUserAuthenticated: false,
                    goneToBackgroundAtTimestamp: newGoneToBackgroundAtTimestamp,
                };

            default:
                return rejectWithValue('unhandled-app-state');
        }
    },
);
