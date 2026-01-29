export enum AppUpdateEventStatus {
    Available = 'available',
    Download = 'download',
    Downloaded = 'downloaded',
    InstallAndRestart = 'install-and-restart',
    InstallOnQuit = 'install-on-quit',
    Closed = 'closed',
    Error = 'error',
}

export enum EventType {
    SuiteReady = 'suite-ready',
    RouterLocationChange = 'router/location-change',
    TransportType = 'transport-type',
    AppUpdate = 'app-update',

    AppUriHandler = 'app/uri-handler',

    DashboardActions = 'dashboard/actions',
    DashboardSendModal = 'dashboard/send-modal',
    DashboardSendModalOptions = 'dashboard/send-modal/options',
    DashboardReceiveModal = 'dashboard/receive-modal',
    DashboardReceiveModalOptions = 'dashboard/receive-modal/options',

    DeviceConnect = 'device-connect',
    DeviceDisconnect = 'device-disconnect',
    DeviceUpdateFirmware = 'device-update-firmware',
    DeviceSetupCompleted = 'device-setup-completed',
    DeviceSetupStarted = 'device-setup-started',

    DeviceConnectionConnectButton = 'device-connection/connect-button',
    DeviceConnectionHintModal = 'device-connection/hint-modal',
    // The rest of device-connection events are in shared constants.

    CreateBackup = 'create-backup',

    CreateReceiveAddressShowAddress = 'create-receive-address/show-address',
    CreateReceiveAddressCopyAddress = 'create-receive-address/copy-address',
    CreateReceiveAddressConfirmOnTrezor = 'create-receive-address/confirm-on-trezor',

    SendInitialised = 'send/initialised',
    SendConfirmedOnDevice = 'send/confirmed-on-device',
    SendDetailOpened = 'send/detail-opened',
    SendQrScan = 'send/qr-scan',

    AccountsStatus = 'accounts/status',
    AccountsTokensStatus = 'accounts/tokens-status',
    AccountsNonZeroBalance = 'accounts/non-zero-balance',
    AccountsActiveStaking = 'accounts/active-staking',
    AccountsNewAccount = 'accounts/new-account',
    AccountsActions = 'accounts/actions',
    AddToken = 'add-token',
    RemoveToken = 'remove-token',
    AccountsEmptyAccountReceive = 'accounts/empty-account/receive',
    AccountsTransactionsExport = 'accounts/transactions-export',

    TransactionCreated = 'transaction-created',
    TransactionRetry = 'transaction/timeout-retry',
    TransactionCancel = 'transaction/cancel',
    SendRawTransaction = 'send-raw-transaction',

    CoinjoinAnonymityGain = 'coinjoin/anonymity-gain',

    TradingNavigate = 'trade/navigate',
    TradingExchange = 'trade/exchange',
    TradingBuy = 'trade/buy',
    TradingSell = 'trade/sell',
    TradingStatus = 'trade/status',
    TradingConfirmTrade = 'trade/confirm-trade',
    TradingCompareOffers = 'trade/compare-offers',
    TradingExchangeApproval = 'trade/approval',
    TradingReceivedQuotes = 'trade/received-quotes',

    StakingNavigate = 'staking/navigate',
    StakingStake = 'staking/stake',
    StakingUnstake = 'staking/unstake',
    StakingClaim = 'staking/claim',
    StakingConfirm = 'staking/confirm',
    StakingUpdateProvider = 'staking/update-provider',

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
    SettingsDeviceChangeThpAutoconnect = 'settings/device/change-thp-autoconnect',
    SettingsDeviceChangePin = 'settings/device/change-pin',
    SettingsDeviceSetupWipeCode = 'settings/device/setup-wipe-code',
    SettingsDeviceChangeWipeCode = 'settings/device/change-wipe-code',
    SettingsDeviceDisableWipeCode = 'settings/device/disable-wipe-code',
    SettingsDeviceUpdateAutoLock = 'settings/device/update-auto-lock',
    SettingsDeviceChangeOrientation = 'settings/device/change-orientation',
    SettingsDeviceChangeHapticFeedback = 'settings/device/change-haptic-feedback',
    SettingsDeviceChangeBrightness = 'settings/device/change-brightness',
    SettingsMultiShareBackup = 'settings/device/multi-share-backup',
    SettingsDeviceChangePassphraseProtection = 'settings/device/change-passphrase-protection',

    SettingsGeneralBioAuth = 'settings/general/bio-auth',
    SettingsGeneralChangeLanguage = 'settings/general/change-language',
    SettingsGeneralChangeTheme = 'settings/general/change-theme',
    SettingsGeneralAddressDisplayType = 'settings/general/address-display-type',
    SettingsGeneralChangeFiat = 'settings/general/change-fiat',
    SettingsGeneralChangeBitcoinUnit = 'settings/general/change-bitcoin-unit',
    SettingsGeneralEarlyAccess = 'settings/general/early-access',
    SettingsGeneralLabeling = 'settings/general/labeling',
    SettingsGeneralLabelingProvider = 'settings/general/labeling-provider',
    SettingsGeneralAutoEject = 'settings/general/auto-eject',
    SettingsGeneralMevProtection = 'settings/general/mev-protection',
    SettingsGeneralNetworkReserve = 'settings/general/network-reserve',
    SettingsCoinsBackend = 'settings/coins/backend',
    SettingsCoins = 'settings/coins',
    SettingsTor = 'settings/tor',
    SettingsTorOnionLinks = 'settings/tor/onion-links',

    SettingsAnalytics = 'settings/analytics',

    GetDesktopApp = 'promo/desktop',
    GetMobileApp = 'promo/mobile',

    ReferralButton = 'promo/referral-button',
    PromoDashboardBanner = 'promo/dashboard-banner',

    AutostartModal = 'autostart-modal',
}
