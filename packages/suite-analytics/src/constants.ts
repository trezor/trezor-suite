import pkg from '../package.json';

// trim major version with dot "0.""
export const VERSION = pkg.version.replace(/0./, '');

export enum AppUpdateEventStatus {
    Downloaded = 'downloaded',
    Closed = 'closed',
    Error = 'error',
}

export enum EventType {
    SuiteReady = 'suite-ready',
    RouterLocationChange = 'router/location-change',
    TransportType = 'transport-type',
    AppUpdate = 'app-update',

    DeviceConnect = 'device-connect',
    DeviceDisconnect = 'device-disconnect',
    DeviceUpdateFirmware = 'device-update-firmware',
    DeviceSetupCompleted = 'device-setup-completed',

    CreateBackup = 'create-backup',
    CheckSeedError = 'check-seed/error',
    CheckSeedSuccess = 'check-seed/success',

    AccountStatus = 'accounts/status',
    WalletAddAccount = 'wallet/add-account',
    AddToken = 'add-token',
    AccountsEmptyAccountBuy = 'accounts/empty-account/buy',
    AccountsEmptyAccountReceive = 'accounts/empty-account/receive',
    TransactionCreated = 'transaction-created',
    SendRawTransaction = 'send-raw-transaction',

    DashboardSecurityCardCreateBackup = 'dashboard/security-card/create-backup',
    DashboardSecurityCardSeedLink = 'dashboard/security-card/seed-link',
    DashboardSecurityCardSetPin = 'dashboard/security-card/set-pin',
    DashboardSecurityCardChangePin = 'dashboard/security-card/change-pin',
    DashboardSecurityCardEnablePassphrase = 'dashboard/security-card/enable-passphrase',
    DashboardSecurityCardCreateHiddenWallet = 'dashboard/security-card/create-hidden-wallet',
    DashboardSecurityCardEnableDiscreet = 'dashboard/security-card/enable-discreet',
    DashboardSecurityCardToggleDiscreet = 'dashboard/security-card/toggle-discreet',

    MenuGotoSwitchDevice = 'menu/goto/switch-device',
    MenuGotoSuiteIndex = 'menu/goto/suite-index',
    MenuGotoWalletIndex = 'menu/goto/wallet-index',
    MenuGotoNotificationsIndex = 'menu/goto/notifications-index',
    MenuNotificationsToggle = 'menu/notifications/toggle',
    MenuGotoSettingsIndex = 'menu/goto/settings-index',
    MenuToggleDiscreet = 'menu/toggle-discreet',
    MenuGotoTor = 'menu/goto/tor',
    MenuToggleTor = 'menu/toggle-tor',
    MenuToggleOnionLinks = 'menu/toggle-onion-links',
    MenuGotoEarlyAccess = 'menu/goto/early-access',

    MenuGuide = 'menu/guide',
    GuideHeaderNavigation = 'guide/header/navigation',
    GuideNodeNavigation = 'guide/node/navigation',
    GuideFeedbackNavigation = 'guide/feedback/navigation',
    GuideFeedbackSubmit = 'guide/feedback/submit',
    GuideTooltipLinkNavigation = 'guide/tooltip-link/navigation',

    SelectWalletType = 'select-wallet-type',
    SwitchDeviceAddWallet = 'switch-device/add-wallet',
    SwitchDeviceAddHiddenWallet = 'switch-device/add-hidden-wallet',
    SwitchDeviceForget = 'switch-device/forget',
    SwitchDeviceRemember = 'switch-device/remember',
    SwitchDeviceEject = 'switch-device/eject',

    SettingsDeviceGotoBackup = 'settings/device/goto/backup',
    SettingsDeviceGotoRecovery = 'settings/device/goto/recovery',
    SettingsDeviceGotoFirmware = 'settings/device/goto/firmware',
    SettingsDeviceChangePinProtection = 'settings/device/change-pin-protection',
    SettingsDeviceChangePin = 'settings/device/change-pin',
    SettingsDeviceChangeLabel = 'settings/device/change-label',
    SettingsDeviceUpdateAutoLock = 'settings/device/update-auto-lock',
    SettingsDeviceGotoBackground = 'settings/device/goto/background',
    SettingsDeviceBackground = 'settings/device/background',
    SettingsDeviceChangeOrientation = 'settings/device/change-orientation',
    SettingsDeviceGotoWipe = 'settings/device/goto/wipe',
    SettingsDeviceChangePassphraseProtection = 'settings/device/change-passphrase-protection',
    SettingsGeneralChangeLanguage = 'settings/general/change-language',
    SettingsGeneralChangeTheme = 'settings/general/change-theme',
    SettingsGeneralChangeFiat = 'settings/general/change-fiat',
    SettingsGeneralEarlyAccess = 'settings/general/early-access',
    SettingsGeneralEarlyAccessCheckForUpdates = 'settings/general/early-access/check-for-updates',
    SettingsGeneralEarlyAccessDownloadStable = 'settings/general/early-access/download-stable',
    SettingsGeneralGotoEarlyAccess = 'settings/general/goto/early-access',
    SettingsCoinBackend = 'settings/coin-backend',

    AnalyticsEnable = 'analytics/enable',
    AnalyticsDispose = 'analytics/dispose',
}
