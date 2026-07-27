export enum AuthenticateError {
    AuthenticationFailed = 'authentication-failed',
    BiometricsNotAvailable = 'biometrics-not-available',
}

export type BiometricsSliceState = {
    isUserAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    biometricsError: AuthenticateError | null;
    isTogglingBiometricsSettingsOption: boolean;
    isAuthenticatingUser: boolean;
    // This property is crucial for bypassing authentication when returning to the app.
    goneToBackgroundAtTimestamp: number | null;
};

export type BiometricsSliceRootState = {
    biometrics: BiometricsSliceState;
};
