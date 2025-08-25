export enum RootStackRoutes {
    AppTabs = 'AppTabs',
    OnboardingStack = 'OnboardingStack',
    DeviceOnboardingStack = 'DeviceOnboardingStack',
    AccountsImport = 'AccountsImport',
    AuthorizeDeviceStack = 'AuthorizeDeviceStack',
    AccountDetail = 'AccountDetail',
    StakingDetail = 'StakingDetail',
    DevUtilsStack = 'DevUtilsStack',
    AccountSettings = 'AccountSettings',
    TransactionDetail = 'TransactionDetail',
    ReceiveStack = 'ReceiveStack',
    SendStack = 'SendStack',
    DeviceSettingsStack = 'DeviceSettingsStack',
    AddCoinAccountStack = 'AddCoinAccountStack',
    CoinEnablingInit = 'CoinEnablingInit',
    ConnectPopup = 'ConnectPopup',
    ConnectPermissions = 'ConnectPermissions',
    WalletConnectSessionPopup = 'WalletConnectSessionPopup',
    WalletConnectSwitchAccount = 'WalletConnectSwitchAccount',
    WalletConnectPair = 'WalletConnectPair',
    SettingsScreenStack = 'SettingsScreenStack',
    DeviceCompromisedModal = 'DeviceCompromisedModal',
    BackupFailedModal = 'BackupFailedModal',
    TradingWebView = 'TradingWebView',
    BootloaderMode = 'BootloaderMode',
}

export enum AppTabsRoutes {
    HomeStack = 'HomeStack',
    AccountsStack = 'AccountsStack',
    TradeStack = 'TradeStack',
    Settings = 'Settings',
}

export enum OnboardingStackRoutes {
    Welcome = 'Welcome',
    AnalyticsConsent = 'AnalyticsConsent',
    Biometrics = 'Biometrics',
}

export enum DeviceOnboardingStackRoutes {
    ConnectAndUnlockDeviceOnboarding = 'ConnectAndUnlockDeviceOnboarding',
    UninitializedDeviceLanding = 'UninitializedDeviceLanding',
    SuspiciousDevice = 'SuspiciousDevice',
    SecurityCheck = 'SecurityCheck',
    FirmwareInstallation = 'FirmwareInstallation', // FIXME
    DeviceAuthenticity = 'DeviceAuthenticity ', // FIXME
    DeviceAuthenticitySuccess = 'DeviceAuthenticitySuccess',
    ConfirmFirmwareUpdate = 'ConfirmFirmwareUpdate', // FIXME
    DeviceTutorial = 'DeviceTutorial',
    CreateOrRecoverCrossroads = 'CreateOrRecoverCrossroads',
    CreateWalletLoading = 'CreateWalletLoading',
    WalletBackupTutorial = 'WalletBackupTutorial',
    WalletBackupRecap = 'WalletBackupRecap',
    WalletCreation = 'WalletCreation',
    WalletCreatedSuccess = 'WalletCreatedSuccess',
    RecoveryInstructions = 'RecoveryInstructions',
    WalletRecovery = 'WalletRecovery',
    WalletRecoveryRecap = 'WalletRecoveryRecap',
    CreatePin = 'CreatePin',
}

export enum AccountsImportStackRoutes {
    SelectNetwork = 'SelectNetwork',
    XpubScan = 'XpubScan',
    AccountImportLoading = 'AccountImportLoading',
    AccountImportSummary = 'AccountImportSummary',
}

export enum DeviceSettingsStackRoutes {
    DeviceSettings = 'DeviceSettings',
    PinProtection = 'PinProtection',
    DevicePinProtectionStack = 'DevicePinProtectionStack',
    FirmwareUpdateStack = 'FirmwareUpdateStack',
    DeviceAuthenticity = 'DeviceAuthenticity', // FIXME
    DeviceAuthenticityStack = 'DeviceAuthenticityStack',
    ContinueOnTrezor = 'ContinueOnTrezor', // FIXME
    WipeDeviceStack = 'WipeDeviceStack',
    DeviceNameStack = 'DeviceNameStack',
    DeviceCheckBackupStack = 'DeviceCheckBackupStack',
}

export enum DevicePinProtectionStackRoutes {
    ContinueOnTrezor = 'ContinueOnTrezor', // FIXME
    EnterCurrentPin = 'EnterCurrentPin',
    EnterNewPin = 'EnterNewPin',
    ConfirmNewPin = 'ConfirmNewPin',
}

export enum FirmwareUpdateStackRoutes {
    ConfirmFirmwareUpdate = 'ConfirmFirmwareUpdate', // FIXME
    FirmwareInstallation = 'FirmwareInstallation', // FIXME
}

export enum DeviceCheckBackupStackRoutes {
    CheckBackupTutorial = 'CheckBackupTutorial',
    CheckBackup = 'CheckBackup',
    CheckBackupSuccess = 'CheckBackupSuccess',
    CheckBackupRecap = 'CheckBackupRecap',
    UnsupportedModel = 'UnsupportedModel',
    CheckBackupFail = 'CheckBackupFail',
    CheckBackupSupport = 'CheckBackupSupport',
}

export enum DeviceAuthenticityStackRoutes {
    AuthenticityCheck = 'AuthenticityCheck',
    AuthenticitySuccess = 'AuthenticitySuccess',
}

export enum WipeDeviceStackRoutes {
    WipeDevice = 'WipeDevice',
    ContinueOnTrezor = 'ContinueOnTrezor', // FIXME
    WipeDeviceLoadingScreen = 'WipeDeviceLoadingScreen',
    FactoryReset = 'FactoryReset',
}

export enum DeviceNameStackRoutes {
    DeviceName = 'DeviceName',
    ContinueOnTrezor = 'ContinueOnTrezor', // FIXME
    DeviceNameLoadingScreen = 'DeviceNameLoadingScreen',
}

export enum AuthorizeDeviceStackRoutes {
    ConnectAndUnlockDeviceAuthorize = 'ConnectAndUnlockDeviceAuthorize',
    TurnOnAndUnlockDevice = 'TurnOnAndUnlockDevice',
    ConnectBluetoothDevice = 'ConnectBluetoothDevice',
    RemoveBluetoothDevice = 'RemoveBluetoothDevice',
    PinMatrix = 'PinMatrix',
    ConnectingDevice = 'ConnectingDevice',

    PassphraseForm = 'PassphraseForm',
    PassphraseConfirmOnTrezor = 'PassphraseConfirmOnTrezor',
    PassphraseLoading = 'PassphraseLoading',
    PassphraseRedirecting = 'PassphraseRedirecting',
    PassphraseDuplicateAlert = 'PassphraseDuplicateAlert',
    PassphraseMismatchAlert = 'PassphraseMismatchAlert',
    PassphraseConfirmFeatureUnlockOnTrezor = 'PassphraseConfirmFeatureUnlockOnTrezor',
    PassphraseEmptyWallet = 'PassphraseEmptyWallet',
    PassphraseVerifyEmptyWallet = 'PassphraseVerifyEmptyWallet',
    PassphraseEnterOnTrezor = 'PassphraseEnterOnTrezor',
    PassphraseEnableOnDevice = 'PassphraseEnableOnDevice',
    PassphraseFeatureUnlockForm = 'PassphraseFeatureUnlockForm',
}

export enum DevUtilsStackRoutes {
    DevUtils = 'DevUtils',
    Demo = 'Demo',
}

export enum HomeStackRoutes {
    Home = 'Home',
}

export enum AccountsStackRoutes {
    Accounts = 'Accounts',
}

export enum ReceiveStackRoutes {
    ReceiveAccounts = 'ReceiveAccounts', // FIXME
    ReceiveAccount = 'ReceiveAccount',
}

export enum SendStackRoutes {
    SendAccounts = 'SendAccounts',
    SendOutputs = 'SendOutputs',
    SendFees = 'SendFees',
    SendUtxo = 'SendUtxo',
    SendDestinationTagReview = 'SendDestinationTagReview',
    SendAddressReview = 'SendAddressReview',
    SendOutputsReview = 'SendOutputsReview',
}

export enum AddCoinAccountStackRoutes {
    AddCoinAccount = 'AddCoinAccount',
    SelectAccountType = 'SelectAccountType',
    AddCoinDiscoveryFinished = 'AddCoinDiscoveryFinished',
    AddCoinDiscoveryRunning = 'AddCoinDiscoveryRunning',
}

export enum SettingsStackRoutes {
    SettingsPreferences = 'SettingsPreferences',
    SettingsPrivacy = 'SettingsPrivacy',
    SettingsViewOnly = 'SettingsViewOnly',
    SettingsSupport = 'SettingsSupport',
    SettingsCoinEnabling = 'SettingsCoinEnabling',
    SettingsDeviceChecks = 'SettingsDeviceChecks',
    TurnOffDeviceAuthenticityCheck = 'TurnOffDeviceAuthenticityCheck',
    TurnOffFirmwareAuthenticityCheck = 'TurnOffFirmwareAuthenticityCheck',
}

export enum TradingStackRoutes {
    Trading = 'Trading',
    ReceiveAccounts = 'ReceiveAccounts', // FIXME
    TradingHistory = 'TradingHistory',
    TradingExchangePreview = 'TradingExchangePreview',
    TradingExchangeApproval = 'TradingExchangeApproval',
}
