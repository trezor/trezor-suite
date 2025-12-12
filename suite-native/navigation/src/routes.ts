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
    TransactionDetailStack = 'TransactionDetailStack',
    ReceiveStack = 'ReceiveStack',
    SendStack = 'SendStack',
    DeviceSettingsStack = 'DeviceSettingsStack',
    AddCoinAccountStack = 'AddCoinAccountStack',
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
    TradingLocationModal = 'TradingLocationModal',
    DemoAccountQuestionnaireStack = 'DemoAccountQuestionnaireStack',
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
    TradingLocation = 'TradingLocation',
}

export enum DeviceOnboardingStackRoutes {
    DeviceDisconnected = 'DeviceDisconnected',
    UninitializedDeviceLanding = 'UninitializedDeviceLanding',
    SuspiciousDevice = 'SuspiciousDevice',
    SecurityCheck = 'SecurityCheck',
    FirmwareInfo = 'FirmwareInfo',
    ConfirmFirmwareUpdate = 'ConfirmFirmwareUpdate',
    FirmwareInstallation = 'FirmwareInstallation',
    ThpPairingInfo = 'ThpPairingInfo',
    ThpConfirmation = 'ThpConfirmation',
    ThpCodeEntry = 'ThpCodeEntry',
    ThpPairingSuccess = 'ThpPairingSuccess',
    DeviceAuthenticity = 'DeviceAuthenticity ',
    DeviceAuthenticitySuccess = 'DeviceAuthenticitySuccess',
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
    DeviceFirmware = 'DeviceFirmware',
    FirmwareUpdateStack = 'FirmwareUpdateStack',
    FirmwareLanguageStack = 'FirmwareLanguageStack',
    DevicePinProtection = 'DevicePinProtection',
    DevicePinProtectionStack = 'DevicePinProtectionStack',
    BackupAndPassphraseStack = 'BackupAndPassphraseStack',
    DeviceAuthenticity = 'DeviceAuthenticity',
    DeviceAuthenticityStack = 'DeviceAuthenticityStack',
    ContinueOnTrezor = 'ContinueOnTrezor',
    WipeDeviceStack = 'WipeDeviceStack',
    DeviceNameStack = 'DeviceNameStack',
    DeviceCheckBackupStack = 'DeviceCheckBackupStack',
    UnpairBluetoothDevice = 'UnpairBluetoothDevice',
    AutoConnectSettings = 'AutoConnectSettings',
}

export enum DevicePinProtectionStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ContinueOnTrezor = 'ContinueOnTrezor',
    EnterCurrentPin = 'EnterCurrentPin',
    EnterNewPin = 'EnterNewPin',
    ConfirmNewPin = 'ConfirmNewPin',
}

export enum FirmwareUpdateStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ConfirmFirmwareUpdate = 'ConfirmFirmwareUpdate',
    FirmwareInstallation = 'FirmwareInstallation',
    ThpConfirmation = 'ThpConfirmation',
}

export enum FirmwareLanguageStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ConfirmLanguageChange = 'ConfirmLanguageChange',
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
    ContinueOnTrezor = 'ContinueOnTrezor',
    WipeDeviceLoadingScreen = 'WipeDeviceLoadingScreen',
    FactoryReset = 'FactoryReset',
}

export enum DeviceNameStackRoutes {
    DeviceName = 'DeviceName',
    ContinueOnTrezor = 'ContinueOnTrezor',
    DeviceNameLoadingScreen = 'DeviceNameLoadingScreen',
}

export enum BackupAndPassphraseStackRoutes {
    BackupAndPassphrase = 'BackupAndPassphrase',
    ContinueOnTrezor = 'ContinueOnTrezor',
}

export enum AuthorizeDeviceStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ConnectDeviceCrossroads = 'ConnectDeviceCrossroads',
    ConnectAndUnlockDevice = 'ConnectAndUnlockDevice',
    TurnOnAndUnlockDevice = 'TurnOnAndUnlockDevice',
    ConnectBluetoothDevice = 'ConnectBluetoothDevice',
    RemoveBluetoothDevice = 'RemoveBluetoothDevice',
    PinMatrix = 'PinMatrix',
    ThpConfirmation = 'ThpConfirmation',
    ThpCodeEntry = 'ThpCodeEntry',
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
    PassphraseFeatureUnlockForm = 'PassphraseFeatureUnlockForm',
    CoinEnablingInit = 'CoinEnablingInit',
}

export enum DevUtilsStackRoutes {
    DevUtils = 'DevUtils',
    Demo = 'Demo',
}

export enum HomeStackRoutes {
    Home = 'Home',
}

export enum DemoAccountQuestionnaireStackRoutes {
    Intro = 'Intro',
    Reason = 'Reason',
    SuiteAction = 'SuiteAction',
    Success = 'Success',
}

export enum AccountsStackRoutes {
    Accounts = 'Accounts',
}

export enum ReceiveStackRoutes {
    ReceiveAccounts = 'ReceiveAccounts',
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
    SettingsLabeling = 'SettingsLabeling',
    SettingsDeviceChecks = 'SettingsDeviceChecks',
    TurnOffDeviceAuthenticityCheck = 'TurnOffDeviceAuthenticityCheck',
    TurnOffFirmwareAuthenticityCheck = 'TurnOffFirmwareAuthenticityCheck',
    SettingsTradingLocation = 'SettingsTradingLocation',
}

export enum TradingStackRoutes {
    Trading = 'Trading',
    ReceiveAccounts = 'ReceiveAccounts',
    TradingHistory = 'TradingHistory',
    TradingExchangePreview = 'TradingExchangePreview',
    TradingExchangeApproval = 'TradingExchangeApproval',
    TradingExchangeRevoke = 'TradingExchangeRevoke',
    TradingSellPreview = 'TradingSellPreview',
    TradingFees = 'TradingFees',
    TradingSellOutputsReview = 'TradingSellOutputsReview',
    TradingExchangeOutputsReview = 'TradingExchangeOutputsReview',
}

export enum TransactionDetailStackRoutes {
    TransactionDetail = 'TransactionDetail',
    TransactionDetailOverview = 'TransactionDetailOverview',
}
