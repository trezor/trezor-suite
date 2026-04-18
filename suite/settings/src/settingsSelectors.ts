import { type ExperimentalFeature } from '@suite/experimental';

import { type SuiteSettingsRootState } from './settingsSlice';

export const selectSuiteSettings = (state: SuiteSettingsRootState) => state.suiteSettings;
export const selectLanguage = (state: SuiteSettingsRootState) => state.suiteSettings.language;
export const selectThemeSettings = (state: SuiteSettingsRootState) => state.suiteSettings.theme;
export const selectTheme = (state: SuiteSettingsRootState) => state.suiteSettings.theme.variant;
export const selectDebugSettings = (state: SuiteSettingsRootState) => state.suiteSettings.debug;
export const selectAutodetectLanguage = (state: SuiteSettingsRootState) =>
    state.suiteSettings.autodetect.language;
export const selectAutodetectTheme = (state: SuiteSettingsRootState) =>
    state.suiteSettings.autodetect.theme;
export const selectAddressDisplayType = (state: SuiteSettingsRootState) =>
    state.suiteSettings.addressDisplayType;
export const selectTorOnionLinks = (state: SuiteSettingsRootState) =>
    state.suiteSettings.torOnionLinks;
export const selectIsCoinjoinReceiveWarningHidden = (state: SuiteSettingsRootState) =>
    state.suiteSettings.isCoinjoinReceiveWarningHidden;
export const selectIsDebugModeActive = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.showDebugMenu;
export const selectIsUnlockedBootloaderAllowed = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.isUnlockedBootloaderAllowed;
export const selectDebugTransports = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.transports;
export const selectShowConnectLogs = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.showConnectLogs;
export const selectInvityServerEnvironment = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.invityServerEnvironment;
export const selectOAuthServerEnvironment = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.oauthServerEnvironment;
export const selectExperimentalFeatures = (state: SuiteSettingsRootState) =>
    state.suiteSettings.experimental;
export const selectIsExperimentalEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.experimental !== undefined;
export const selectHasExperimentalFeature =
    (feature: ExperimentalFeature) => (state: SuiteSettingsRootState) =>
        state.suiteSettings.experimental?.includes(feature) ?? false;
export const selectIsDeviceAuthenticityCheckEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.enabledSecurityChecks.deviceAuthenticity;
export const selectIsEntropyCheckEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.enabledSecurityChecks.entropy;
export const selectIsFirmwareHashCheckEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.enabledSecurityChecks.firmwareHash;
export const selectIsFirmwareRevisionCheckEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.enabledSecurityChecks.firmwareRevision;
export const selectAreDeviceMetaChecksEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.enabledSecurityChecks.deviceMeta;
export const selectSidebarWidth = (state: SuiteSettingsRootState) =>
    state.suiteSettings.sidebarWidth;
export const selectIsCoinsFilterVisible = (state: SuiteSettingsRootState) =>
    state.suiteSettings.isCoinsFilterVisible;
export const selectIsN4w1BackupEnabled = (state: SuiteSettingsRootState) =>
    state.suiteSettings.debug.isN4w1BackupEnabled;
export const selectFocusOnDeviceUnlock = (state: SuiteSettingsRootState) =>
    state.suiteSettings.focusOnDeviceUnlock;
