export enum AppUpdateEventStatus {
    Available = 'available',
    Download = 'download',
    Downloaded = 'downloaded',
    InstallAndRestart = 'install-and-restart',
    InstallOnQuit = 'install-on-quit',
    Closed = 'closed',
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Error = 'error',
}

export enum EventType {
    SuiteReady = 'suite-ready',
    RouterLocationChange = 'router/location-change',
    TransportType = 'transport-type',
    AppUpdate = 'app-update',

    AppUriHandler = 'app/uri-handler',

    DashboardActions = 'dashboard/actions',

    DeviceConnect = 'device-connect',
    DeviceDisconnect = 'device-disconnect',
    DeviceUpdateFirmware = 'device-update-firmware',
    DeviceSetupCompleted = 'device-setup-completed',

    FirmwareValidateHashError = 'firmware-validate-hash-error',
    FirmwareValidateHashMismatch = 'firmware-validate-hash-mismatch',

    CreateBackup = 'create-backup',

    AccountsStatus = 'accounts/status',
    AccountsTokensStatus = 'accounts/tokens-status',
    AccountsNonZeroBalance = 'accounts/non-zero-balance',
    AccountsNewAccount = 'accounts/new-account',
    AccountsActions = 'accounts/actions',
    AddToken = 'add-token',
    AccountsEmptyAccountBuy = 'accounts/empty-account/buy',
    AccountsEmptyAccountReceive = 'accounts/empty-account/receive',
    AccountsTransactionsExport = 'accounts/transactions-export',
    AccountsDashboardBuy = 'accounts/dashboard/buy',
    AccountsTradeboxButton = 'accounts/tradebox/button',
    TransactionCreated = 'transaction-created',
    SendRawTransaction = 'send-raw-transaction',

    CoinjoinAnonymityGain = 'coinjoin/anonymity-gain',

    CoinmarketConfirmTrade = 'trade/confirm-trade',

    MenuGuide = 'menu/guide',
    MenuNotificationsToggle = 'menu/notifications/toggle',
    MenuToggleDiscreet = 'menu/toggle-discreet',

    GuideHeaderNavigation = 'guide/header/navigation',
    GuideNodeNavigation = 'guide/node/navigation',
    GuideFeedbackNavigation = 'guide/feedback/navigation',
    GuideFeedbackSubmit = 'guide/feedback/submit',
    GuideTooltipLinkNavigation = 'guide/tooltip-link/navigation',

    SelectWalletType = 'select-wallet-type',
    SwitchDeviceForget = 'switch-device/forget',
    SwitchDeviceRemember = 'switch-device/remember',
    SwitchDeviceEject = 'switch-device/eject',
    ViewOnlyPromo = 'view-only-promo',

    SettingsDeviceCheckSeed = 'settings/device/check-seed',
    SettingsDeviceChangePinProtection = 'settings/device/change-pin-protection',
    SettingsDeviceChangePin = 'settings/device/change-pin',
    SettingsDeviceSetupWipeCode = 'settings/device/setup-wipe-code',
    SettingsDeviceChangeWipeCode = 'settings/device/change-wipe-code',
    SettingsDeviceDisableWipeCode = 'settings/device/disable-wipe-code',
    SettingsDeviceChangeLabel = 'settings/device/change-label',
    SettingsDeviceUpdateAutoLock = 'settings/device/update-auto-lock',
    SettingsDeviceChangeOrientation = 'settings/device/change-orientation',
    SettingsDeviceChangeHapticFeedback = 'settings/device/change-haptic-feedback',
    SettingsDeviceChangeBrightness = 'settings/device/change-brightness',
    SettingsMultiShareBackup = 'settings/device/multi-share-backup',
    SettingsDeviceWipe = 'settings/device/wipe',
    SettingsDeviceChangePassphraseProtection = 'settings/device/change-passphrase-protection',
    SettingsDeviceDefaultWalletLoading = 'settings/device/default-wallet-type',

    SettingsGeneralChangeLanguage = 'settings/general/change-language',
    SettingsGeneralChangeTheme = 'settings/general/change-theme',
    SettingsGeneralAddressDisplayType = 'settings/general/address-display-type',
    SettingsGeneralChangeFiat = 'settings/general/change-fiat',
    SettingsGeneralChangeBitcoinUnit = 'settings/general/change-bitcoin-unit',
    SettingsGeneralEarlyAccess = 'settings/general/early-access',
    SettingsGeneralLabeling = 'settings/general/labeling',
    SettingsGeneralLabelingProvider = 'settings/general/labeling-provider',
    SettingsCoinsBackend = 'settings/coins/backend',
    SettingsCoins = 'settings/coins',
    SettingsTor = 'settings/tor',
    SettingsTorOnionLinks = 'settings/tor/onion-links',

    SettingsAnalytics = 'settings/analytics',

    GetDesktopApp = 'promo/desktop',
    GetMobileApp = 'promo/mobile',

    T3T1DashboardPromo = 'promo/t3t1-dashboard',
}
