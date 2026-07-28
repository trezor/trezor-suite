import { configureStore } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';

import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';

import { biometricsSlice, biometricsSliceInitialState } from './biometricsSlice';
import {
    BiometricsToggleResult,
    authenticateUserThunk,
    handleBiometricsAppStateChangeThunk,
    toggleBiometricsSettingsThunk,
} from './biometricsThunks';
import { AuthenticateError, type BiometricsSliceState } from './types';

jest.mock('expo-local-authentication', () => ({
    SecurityLevel: {
        NONE: 0,
        SECRET: 1,
        BIOMETRIC: 2,
    },
    authenticateAsync: jest.fn(),
    cancelAuthenticate: jest.fn(),
    getEnrolledLevelAsync: jest.fn(),
}));

const analyticsReport = jest.fn();

const mockFailedAuthentication = () => {
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({
        success: false,
        error: 'user_cancel',
        warning: 'cancelled',
    });
};

const createBiometricsStore = (
    preloadedBiometricsState: BiometricsSliceState = biometricsSliceInitialState,
) =>
    configureStore({
        reducer: {
            biometrics: biometricsSlice.reducer,
        },
        preloadedState: {
            biometrics: preloadedBiometricsState,
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false,
                thunk: {
                    extraArgument: {
                        services: {
                            analytics: mockNativeAnalytics(analyticsReport),
                        },
                    },
                },
            }),
    });

describe('biometricsThunks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(LocalAuthentication.getEnrolledLevelAsync).mockResolvedValue(
            LocalAuthentication.SecurityLevel.BIOMETRIC,
        );
        jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({
            success: true,
        });
    });

    describe('authenticateUserThunk', () => {
        it('should reject when biometrics are not available', async () => {
            jest.mocked(LocalAuthentication.getEnrolledLevelAsync).mockResolvedValue(
                LocalAuthentication.SecurityLevel.NONE,
            );
            const store = createBiometricsStore();

            const result = await store.dispatch(authenticateUserThunk());

            expect(result.type).toBe(authenticateUserThunk.rejected.type);
            expect(result.payload).toBe(AuthenticateError.BiometricsNotAvailable);
            expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
        });

        it('should fulfill when authentication succeeds', async () => {
            const store = createBiometricsStore();

            const result = await store.dispatch(authenticateUserThunk());

            expect(result.type).toBe(authenticateUserThunk.fulfilled.type);
            expect(store.getState().biometrics.isUserAuthenticated).toBe(true);
        });

        it('should reject when authentication fails', async () => {
            mockFailedAuthentication();
            const store = createBiometricsStore();

            const result = await store.dispatch(authenticateUserThunk());

            expect(result.type).toBe(authenticateUserThunk.rejected.type);
            expect(result.payload).toBe(AuthenticateError.AuthenticationFailed);
            expect(store.getState().biometrics.biometricsError).toBe(
                AuthenticateError.AuthenticationFailed,
            );
        });
    });

    describe('toggleBiometricsSettingsThunk', () => {
        it.each([
            {
                description: 'enable biometrics and report analytics',
                previousIsBiometricsEnabled: false,
                expectedResult: BiometricsToggleResult.Enabled,
                expectedIsBiometricsEnabled: true,
            },
            {
                description: 'disable biometrics and report analytics',
                previousIsBiometricsEnabled: true,
                expectedResult: BiometricsToggleResult.Disabled,
                expectedIsBiometricsEnabled: false,
            },
        ])(
            'should $description',
            async ({
                previousIsBiometricsEnabled,
                expectedResult,
                expectedIsBiometricsEnabled,
            }) => {
                const store = createBiometricsStore({
                    ...biometricsSliceInitialState,
                    isBiometricsEnabled: previousIsBiometricsEnabled,
                });

                const result = await store.dispatch(toggleBiometricsSettingsThunk());

                expect(result.type).toBe(toggleBiometricsSettingsThunk.fulfilled.type);
                expect(result.payload).toBe(expectedResult);
                expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
                expect(store.getState().biometrics.isBiometricsEnabled).toBe(
                    expectedIsBiometricsEnabled,
                );
                expect(analyticsReport).toHaveBeenCalledWith({
                    type: events.biometricsChangeEvent.name,
                    payload: {
                        enabled: expectedIsBiometricsEnabled,
                        origin: 'settingsToggle',
                    },
                });
            },
        );

        it('should reject when authentication fails', async () => {
            mockFailedAuthentication();
            const store = createBiometricsStore();

            const result = await store.dispatch(toggleBiometricsSettingsThunk());

            expect(result.type).toBe(toggleBiometricsSettingsThunk.rejected.type);
            expect(result.payload).toBe(AuthenticateError.AuthenticationFailed);
            expect(store.getState().biometrics.isBiometricsEnabled).toBe(false);
            expect(analyticsReport).not.toHaveBeenCalled();
        });
    });

    describe('handleBiometricsAppStateChangeThunk', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(100_000);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should reject when biometrics are disabled', async () => {
            const store = createBiometricsStore();

            const result = await store.dispatch(
                handleBiometricsAppStateChangeThunk({ nextAppState: 'active' }),
            );

            expect(result.type).toBe(handleBiometricsAppStateChangeThunk.rejected.type);
            expect(result.payload).toBe('biometrics-disabled');
        });

        it.each([
            {
                description: 'revoke authentication and store timestamp on background',
                nextAppState: 'background' as const,
                isTogglingBiometricsSettingsOption: false,
                expectedPayload: {
                    isUserAuthenticated: false,
                    goneToBackgroundAtTimestamp: 100_000,
                },
                expectedIsUserAuthenticated: false,
            },
            {
                description: 'not revoke authentication on inactive while toggling biometrics',
                nextAppState: 'inactive' as const,
                isTogglingBiometricsSettingsOption: true,
                expectedPayload: { goneToBackgroundAtTimestamp: 100_000 },
                expectedIsUserAuthenticated: true,
            },
        ])(
            'should $description',
            async ({
                nextAppState,
                isTogglingBiometricsSettingsOption,
                expectedPayload,
                expectedIsUserAuthenticated,
            }) => {
                const store = createBiometricsStore({
                    ...biometricsSliceInitialState,
                    isBiometricsEnabled: true,
                    isUserAuthenticated: true,
                    isTogglingBiometricsSettingsOption,
                });

                const result = await store.dispatch(
                    handleBiometricsAppStateChangeThunk({ nextAppState }),
                );

                expect(result.type).toBe(handleBiometricsAppStateChangeThunk.fulfilled.type);
                expect(result.payload).toEqual(expectedPayload);
                expect(store.getState().biometrics.isUserAuthenticated).toBe(
                    expectedIsUserAuthenticated,
                );
                expect(store.getState().biometrics.goneToBackgroundAtTimestamp).toBe(100_000);
            },
        );

        it('should restore authentication when returning active within timeout', async () => {
            const store = createBiometricsStore({
                ...biometricsSliceInitialState,
                isBiometricsEnabled: true,
                isUserAuthenticated: false,
                goneToBackgroundAtTimestamp: 90_000,
            });

            const result = await store.dispatch(
                handleBiometricsAppStateChangeThunk({ nextAppState: 'active' }),
            );

            expect(result.type).toBe(handleBiometricsAppStateChangeThunk.fulfilled.type);
            expect(result.payload).toEqual({ isUserAuthenticated: true });
            expect(store.getState().biometrics.isUserAuthenticated).toBe(true);
            expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
        });

        it('should require authentication again when returning active after failed authentication', async () => {
            mockFailedAuthentication();
            const store = createBiometricsStore({
                ...biometricsSliceInitialState,
                isBiometricsEnabled: true,
            });

            await store.dispatch(authenticateUserThunk());

            const backgroundResult = await store.dispatch(
                handleBiometricsAppStateChangeThunk({ nextAppState: 'background' }),
            );

            expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
            // Clear the failed authentication call so the final expectation only checks the retry.
            jest.mocked(LocalAuthentication.authenticateAsync).mockClear();

            const activeResult = await store.dispatch(
                handleBiometricsAppStateChangeThunk({ nextAppState: 'active' }),
            );
            // The app-state thunk dispatches authentication without awaiting it.
            await Promise.resolve();

            expect(backgroundResult.payload).toEqual({
                isUserAuthenticated: false,
                goneToBackgroundAtTimestamp: null,
            });
            expect(activeResult.payload).toBe(undefined);
            expect(store.getState().biometrics.isUserAuthenticated).toBe(false);
            expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
        });

        it('should dispatch authentication when returning active after timeout', async () => {
            const store = createBiometricsStore({
                ...biometricsSliceInitialState,
                isBiometricsEnabled: true,
                isUserAuthenticated: false,
                goneToBackgroundAtTimestamp: 1,
            });

            const result = await store.dispatch(
                handleBiometricsAppStateChangeThunk({ nextAppState: 'active' }),
            );

            expect(result.type).toBe(handleBiometricsAppStateChangeThunk.fulfilled.type);
            expect(result.payload).toBe(undefined);
            expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
        });
    });
});
