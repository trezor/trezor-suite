import { isRejected } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import { LocalAuthenticationResult } from 'expo-local-authentication';

import { createThunk } from '@suite-common/redux-utils';
import { EventType, analytics } from '@suite-native/analytics';

import {
    selectIsBiometricsEnabled,
    setIsBiometricsOverlayVisible,
    setIsUserAuthenticated,
    toggleEnableBiometrics,
} from './biometricsSlice';
import { getIsBiometricsFeatureAvailable } from './isBiometricsFeatureAvailable';

export enum AuthenticateError {
    BiometricsNotAvailable = 'biometrics-not-available',
    AuthenticationFailed = 'authentication-failed',
    AuthenticationAlreadyInProgress = 'authentication-already-in-progress',
}

export const authenticate = createThunk<
    LocalAuthenticationResult,
    void,
    {
        rejectValue: AuthenticateError;
    }
>(`biometrics/authenticate`, async (_, { rejectWithValue }) => {
    const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

    if (!isBiometricsAvailable) return rejectWithValue(AuthenticateError.BiometricsNotAvailable);

    const result = await LocalAuthentication.authenticateAsync();

    if (!result.success) {
        return rejectWithValue(AuthenticateError.AuthenticationFailed);
    }

    return result;
});

export type BiometricsToggleResult = 'enabled' | 'disabled';
export enum ToggleBiometricsError {
    NotAvailable = 'notAvailable',
    Failed = 'failed',
}
export const toggleBiometricsSettings = createThunk<
    BiometricsToggleResult,
    void,
    { rejectValue: ToggleBiometricsError }
>(`biometrics/toggleBiometricsSettings`, async (_, { getState, rejectWithValue, dispatch }) => {
    const authResult = await dispatch(authenticate()).unwrap();

    if (isRejected(authResult)) {
        if (authResult.payload === AuthenticateError.BiometricsNotAvailable) {
            return rejectWithValue(ToggleBiometricsError.NotAvailable);
        }

        if (authResult.payload === AuthenticateError.AuthenticationFailed) {
            return rejectWithValue(ToggleBiometricsError.Failed);
        }
    }

    dispatch(setIsBiometricsOverlayVisible(false));

    const isBiometricsEnabled = selectIsBiometricsEnabled(getState());

    if (isBiometricsEnabled) {
        dispatch(toggleEnableBiometrics(false));
        dispatch(setIsUserAuthenticated(false));
        analytics.report({
            type: EventType.BiometricsChange,
            payload: { enabled: false, origin: 'settingsToggle' },
        });

        return 'disabled';
    } else {
        dispatch(setIsUserAuthenticated(true));
        dispatch(toggleEnableBiometrics(true));
        analytics.report({
            type: EventType.BiometricsChange,
            payload: { enabled: true, origin: 'settingsToggle' },
        });

        return 'enabled';
    }
});
