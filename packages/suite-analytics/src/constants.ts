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

    MenuNotificationsToggle = 'menu/notifications/toggle',
    MenuToggleDiscreet = 'menu/toggle-discreet',
    MenuToggleTor = 'menu/toggle-tor',
    MenuToggleOnionLinks = 'menu/toggle-onion-links',

    MenuGuide = 'menu/guide',
    GuideHeaderNavigation = 'guide/header/navigation',
    GuideNodeNavigation = 'guide/node/navigation',
    GuideFeedbackNavigation = 'guide/feedback/navigation',
    GuideFeedbackSubmit = 'guide/feedback/submit',
    GuideTooltipLinkNavigation = 'guide/tooltip-link/navigation',

    SelectWalletType = 'select-wallet-type',
    SwitchDeviceForget = 'switch-device/forget',
    SwitchDeviceRemember = 'switch-device/remember',
    SwitchDeviceEject = 'switch-device/eject',

    SettingsDeviceChangePinProtection = 'settings/device/change-pin-protection',
    SettingsDeviceChangePin = 'settings/device/change-pin',
    SettingsDeviceChangeLabel = 'settings/device/change-label',
    SettingsDeviceUpdateAutoLock = 'settings/device/update-auto-lock',
    SettingsDeviceBackground = 'settings/device/background',
    SettingsDeviceChangeOrientation = 'settings/device/change-orientation',
    SettingsDeviceWipe = 'settings/device/wipe',
    SettingsDeviceChangePassphraseProtection = 'settings/device/change-passphrase-protection',
    SettingsGeneralChangeLanguage = 'settings/general/change-language',
    SettingsGeneralChangeTheme = 'settings/general/change-theme',
    SettingsGeneralChangeFiat = 'settings/general/change-fiat',
    SettingsGeneralEarlyAccess = 'settings/general/early-access',
    SettingsCoinBackend = 'settings/coin-backend',

    AnalyticsEnable = 'analytics/enable',
    AnalyticsDispose = 'analytics/dispose',
}
