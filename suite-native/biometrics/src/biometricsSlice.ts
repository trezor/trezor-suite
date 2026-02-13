/* eslint-disable @typescript-eslint/no-use-before-define */
import { type AppStateStatus, Platform } from 'react-native';

import { type PayloadAction, createSlice, isAnyOf, isRejected } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import type { LocalAuthenticationResult } from 'expo-local-authentication';

import { createThunk } from '@suite-common/redux-utils';
import { asTypedNativeAnalytics, events } from '@suite-native/analytics';

import { getIsBiometricsFeatureAvailable, getShouldRevokeAuth } from './biometricsUtils';

export enum AuthenticateError {
    AuthenticationFailed = 'authentication-failed',
    BiometricsNotAvailable = 'biometrics-not-available',
}

export enum BiometricsToggleResult {
    Enabled = 'enabled',
    Disabled = 'disabled',
    BiometricsNotAvailable = 'biometrics-not-available',
}

export type BiometricsSliceState = {
    isUserAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    biometricsError: AuthenticateError | null;
    isTogglingBiometricsSettingsOption: boolean;
    isAuthenticatingUser: boolean;
    goneToBackgroundAtTimestamp: number | null;
};

type BiometricsSliceRootState = {
    biometrics: BiometricsSliceState;
};

export const biometricsSliceInitialState: BiometricsSliceState = {
    isUserAuthenticated: false,
    isBiometricsEnabled: false,
    biometricsError: null,
    isTogglingBiometricsSettingsOption: false,
    isAuthenticatingUser: false,
    goneToBackgroundAtTimestamp: null,
};

export const biometricsPersistWhitelist: Array<keyof BiometricsSliceState> = [
    'isBiometricsEnabled',
];

const BIOMETRICS_THUNK_PREFIX = 'biometrics';

const selectIsBiometricsEnabled = (state: BiometricsSliceRootState) =>
    state.biometrics.isBiometricsEnabled;
const selectIsUserAuthenticated = (state: BiometricsSliceRootState) =>
    state.biometrics.isUserAuthenticated;
const selectShouldUserBeAuthenticated = (state: BiometricsSliceRootState) =>
    selectIsBiometricsEnabled(state) && !selectIsUserAuthenticated(state);
const selectIsTogglingBiometrics = (state: BiometricsSliceRootState) =>
    state.biometrics.isTogglingBiometricsSettingsOption;
const selectGoneToBackgroundAtTimestamp = (state: BiometricsSliceRootState) =>
    state.biometrics.goneToBackgroundAtTimestamp;

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

export const toggleBiometricsSettingsThunk = createThunk<
    BiometricsToggleResult,
    void,
    { rejectValue: BiometricsToggleResult | AuthenticateError }
>(
    `${BIOMETRICS_THUNK_PREFIX}/toggleBiometricsSettings`,
    async (_, { getState, rejectWithValue, dispatch, extra }) => {
        const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();
        const { services } = extra;

        if (!isBiometricsAvailable)
            return rejectWithValue(BiometricsToggleResult.BiometricsNotAvailable);

        const authResult = await dispatch(authenticateUserThunk());

        if (isRejected(authResult) && authResult.payload) {
            return rejectWithValue(authResult.payload);
        }

        const isBiometricsEnabled = selectIsBiometricsEnabled(getState());

        if (isBiometricsEnabled) {
            dispatch(toggleEnableBiometrics(false));
            asTypedNativeAnalytics(services.analytics).report({
                type: events.biometricsChangeEvent.name,
                payload: { enabled: false, origin: 'settingsToggle' },
            });

            return BiometricsToggleResult.Disabled;
        }

        dispatch(toggleEnableBiometrics(true));
        asTypedNativeAnalytics(services.analytics).report({
            type: events.biometricsChangeEvent.name,
            payload: { enabled: true, origin: 'settingsToggle' },
        });

        return BiometricsToggleResult.Enabled;
    },
);

export const handleBiometricsAppStateChangeThunk = createThunk(
    `${BIOMETRICS_THUNK_PREFIX}/handleAppStateChange`,
    ({ currentAppState }: { currentAppState: AppStateStatus }, { getState, dispatch }) => {
        const goneToBackgroundAtTimestamp = selectGoneToBackgroundAtTimestamp(getState());
        const shouldUserBeAuthenticated = selectShouldUserBeAuthenticated(getState());
        const isTogglingBiometricsInProgress = selectIsTogglingBiometrics(getState());
        const isBiometricsOptionEnabled = selectIsBiometricsEnabled(getState());
        const shouldRevokeAuth = getShouldRevokeAuth(goneToBackgroundAtTimestamp);

        if (!isBiometricsOptionEnabled) return;

        switch (currentAppState) {
            case 'active':
                if (shouldRevokeAuth && shouldUserBeAuthenticated) {
                    dispatch(authenticateUserThunk());
                } else if (!shouldRevokeAuth) {
                    dispatch(setIsUserAuthenticated(true));
                }
                break;

            case 'background':
                // Stop the authentication flow if user leaves the app on Android.
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

export const biometricsSlice = createSlice({
    name: 'biometrics',
    initialState: biometricsSliceInitialState,
    reducers: {
        setIsUserAuthenticated: (state, { payload }: PayloadAction<boolean>) => {
            state.isUserAuthenticated = payload;
        },
        toggleEnableBiometrics: (state, { payload }: PayloadAction<boolean>) => {
            state.isBiometricsEnabled = payload;
        },
        changeGoneToBackgroundAtTimestamp: (state, { payload }: PayloadAction<number>) => {
            state.goneToBackgroundAtTimestamp = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(authenticateUserThunk.pending, state => {
                state.biometricsError = null;
            })
            .addCase(authenticateUserThunk.fulfilled, state => {
                state.biometricsError = null;
            })
            .addCase(authenticateUserThunk.rejected, (state, { payload }) => {
                if (payload === AuthenticateError.AuthenticationFailed) {
                    state.biometricsError = payload ?? null;
                }
            })
            .addCase(toggleBiometricsSettingsThunk.pending, state => {
                state.isTogglingBiometricsSettingsOption = true;
            })
            .addMatcher(
                isAnyOf(
                    toggleBiometricsSettingsThunk.rejected,
                    toggleBiometricsSettingsThunk.fulfilled,
                ),
                state => {
                    state.isTogglingBiometricsSettingsOption = false;
                },
            );
    },
});

export const { setIsUserAuthenticated, toggleEnableBiometrics, changeGoneToBackgroundAtTimestamp } =
    biometricsSlice.actions;
