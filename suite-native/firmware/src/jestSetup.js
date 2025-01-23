jest.mock('@suite-native/firmware', () => ({
    ...jest.requireActual('./nativeFirmwareSlice'),
    ...jest.requireActual('./hooks/useIsFirmwareUpdateFeatureEnabled'),
    UpdateProgressIndicatorDemo: () => null,
    FirmwareUpdateInProgressScreen: () => null,
}));
