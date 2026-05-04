import { type AppStateStatus, Platform } from 'react-native';

import { isRejected } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import type { LocalAuthenticationResult } from 'expo-local-authentication';

import { createThunk } from '@suite-common/redux-utils';
import { asTypedNativeAnalytics, events } from '@suite-native/analytics';

import {
    selectGoneToBackgroundAtTimestamp,
    selectIsBiometricsEnabled,
    selectIsTogglingBiometrics,
    selectShouldUserBeAuthenticated,
} from './biometricsSelectors';
import { getIsBiometricsFeatureAvailable, getShouldRevokeAuth } from './biometricsUtils';
import { AuthenticateError } from './types';

export enum BiometricsToggleResult {
    Enabled = 'enabled',
    Disabled = 'disabled',
    BiometricsNotAvailable = 'biometrics-not-available',
}

export type BiometricsAppStateChangePayload = {
    isUserAuthenticated?: boolean;
    goneToBackgroundAtTimestamp?: number;
};

type BiometricsAppStateChangeRejectReason = 'biometrics-disabled' | 'unhandled-app-state';

const BIOMETRICS_THUNK_PREFIX = 'biometrics';

export const authenticateUserThunk = createThunk<
    LocalAuthenticationResult,
    void,
    { rejectValue: AuthenticateError }
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

export const toggleBiometricsSettingsThunk = createThunk<
    BiometricsToggleResult,
    void,
    { rejectValue: BiometricsToggleResult | AuthenticateError }
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

export const handleBiometricsAppStateChangeThunk = createThunk<
    BiometricsAppStateChangePayload | undefined,
    { currentAppState: AppStateStatus },
    { rejectValue: BiometricsAppStateChangeRejectReason }
>(
    `${BIOMETRICS_THUNK_PREFIX}/handleAppStateChange`,
    ({ currentAppState }, { getState, dispatch, rejectWithValue }) => {
        const goneToBackgroundAtTimestamp = selectGoneToBackgroundAtTimestamp(getState());
        const shouldUserBeAuthenticated = selectShouldUserBeAuthenticated(getState());
        const isTogglingBiometricsInProgress = selectIsTogglingBiometrics(getState());
        const isBiometricsOptionEnabled = selectIsBiometricsEnabled(getState());
        const shouldRevokeAuth = getShouldRevokeAuth(goneToBackgroundAtTimestamp);

        if (!isBiometricsOptionEnabled) {
            return rejectWithValue('biometrics-disabled');
        }

        switch (currentAppState) {
            case 'active':
                if (goneToBackgroundAtTimestamp !== null && !shouldRevokeAuth) {
                    // Returning to the foreground within the keep-logged-in window: restore prior auth.
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
                    goneToBackgroundAtTimestamp: Date.now(),
                };

            case 'inactive':
                if (isTogglingBiometricsInProgress) {
                    return { goneToBackgroundAtTimestamp: Date.now() };
                }

                return {
                    isUserAuthenticated: false,
                    goneToBackgroundAtTimestamp: Date.now(),
                };

            default:
                return rejectWithValue('unhandled-app-state');
        }
    },
);
