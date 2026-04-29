export enum RootStackRoutes {
    AppTabs = 'AppTabs',
    OnboardingStack = 'OnboardingStack',
    DeviceOnboardingStack = 'DeviceOnboardingStack',
    AccountsImport = 'AccountsImport',
    AuthorizeDeviceStack = 'AuthorizeDeviceStack',
    AccountDetail = 'AccountDetail',
    StakingDetail = 'StakingDetail',
    StakingManagement = 'StakingManagement',
    StakingInsufficientBalance = 'StakingInsufficientBalance',
    HowStakeWorksScreen = 'HowStakeWorksScreen',
    EarnForm = 'EarnForm',
    EarnConsents = 'EarnConsents',
    EarnTransactionDataReview = 'EarnTransactionDataReview',
    ClaimReview = 'ClaimReview',
    ClaimTransactionDataReview = 'ClaimTransactionDataReview',
    DevUtils = 'DevUtils',
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
    BootloaderMode = 'BootloaderMode',
    TradingLocationModal = 'TradingLocationModal',
    DemoAccountQuestionnaireStack = 'DemoAccountQuestionnaireStack',
    Storybook = 'Storybook',
    PassphraseStack = 'PassphraseStack',
    StellarManageTokenStack = 'StellarManageTokenStack',
    FeatureFeedbackModal = 'FeatureFeedbackModal',
    UnstakeFlow = 'UnstakeFlow',
    UnstakeTransactionDataReview = 'UnstakeTransactionDataReview',
}

export enum AppTabsRoutes {
    HomeStack = 'HomeStack',
    AccountsStack = 'AccountsStack',
    TradeStack = 'TradeStack',
    EarnStack = 'EarnStack',
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
    DeviceNameStack = 'DeviceNameStack',
    DeviceFirmware = 'DeviceFirmware',
    FirmwareUpdateStack = 'FirmwareUpdateStack',
    FirmwareLanguageStack = 'FirmwareLanguageStack',
    DeviceConnection = 'DeviceConnection',
    DeviceAutoConnectStack = 'DeviceAutoConnectStack',
    ForgetDevice = 'ForgetDevice',
    ForgetDeviceStack = 'ForgetDeviceStack',
    DevicePinProtection = 'DevicePinProtection',
    DevicePinProtectionStack = 'DevicePinProtectionStack',
    DeviceBackupAndPassphrase = 'DeviceBackupAndPassphrase',
    DeviceCheckBackupStack = 'DeviceCheckBackupStack',
    DevicePassphraseStack = 'DevicePassphraseStack',
    DeviceAuthenticity = 'DeviceAuthenticity',
    DeviceAuthenticityStack = 'DeviceAuthenticityStack',
    WipeDevice = 'WipeDevice',
    WipeDeviceStack = 'WipeDeviceStack',
}

export enum DeviceNameStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    DeviceName = 'DeviceName',
    ContinueOnTrezor = 'ContinueOnTrezor',
    DeviceNameLoadingScreen = 'DeviceNameLoadingScreen',
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

export enum DeviceAutoConnectStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ConfirmAutoConnect = 'ConfirmAutoConnect',
}

export enum ForgetDeviceStackRoutes {
    ForgetDeviceConfirmation = 'ForgetDeviceConfirmation',
    ForgetDeviceGuide = 'ForgetDeviceGuide',
    ForgetDeviceFinish = 'ForgetDeviceFinish',
}

export enum DevicePinProtectionStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ContinueOnTrezor = 'ContinueOnTrezor',
    EnterCurrentPin = 'EnterCurrentPin',
    EnterNewPin = 'EnterNewPin',
    ConfirmNewPin = 'ConfirmNewPin',
}

export enum DeviceCheckBackupStackRoutes {
    UnsupportedModel = 'UnsupportedModel',
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    CheckBackupTutorial = 'CheckBackupTutorial',
    CheckBackup = 'CheckBackup',
    CheckBackupSuccess = 'CheckBackupSuccess',
    CheckBackupRecap = 'CheckBackupRecap',
    CheckBackupFail = 'CheckBackupFail',
    CheckBackupSupport = 'CheckBackupSupport',
}

export enum DevicePassphraseStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ContinueOnTrezor = 'ContinueOnTrezor',
}

export enum DeviceAuthenticityStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    AuthenticityCheck = 'AuthenticityCheck',
    AuthenticitySuccess = 'AuthenticitySuccess',
}

export enum WipeDeviceStackRoutes {
    DeviceConnectionGuard = 'DeviceConnectionGuard',
    ContinueOnTrezor = 'ContinueOnTrezor',
    WipeDeviceLoadingScreen = 'WipeDeviceLoadingScreen',
    FactoryReset = 'FactoryReset',
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
    PassphraseEnterOnTrezor = 'PassphraseEnterOnTrezor',
    PassphraseConfirmOnTrezor = 'PassphraseConfirmOnTrezor',
    CoinEnablingInit = 'CoinEnablingInit',
    ContinueOnTrezor = 'ContinueOnTrezor',
}

export enum PassphraseStackRoutes {
    PassphraseForm = 'PassphraseForm',
    PassphraseLoading = 'PassphraseLoading',
    PassphraseEnterOnTrezor = 'PassphraseEnterOnTrezor',
    PassphraseConfirmOnTrezor = 'PassphraseConfirmOnTrezor',
    PassphraseRedirecting = 'PassphraseRedirecting',
    PassphraseDuplicateAlert = 'PassphraseDuplicateAlert',
    PassphraseMismatchAlert = 'PassphraseMismatchAlert',
    PassphraseEmptyWallet = 'PassphraseEmptyWallet',
    PassphraseVerifyEmptyWallet = 'PassphraseVerifyEmptyWallet',
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

export enum EarnStackRoutes {
    Earn = 'Earn',
}

export enum ReceiveStackRoutes {
    ReceiveAccounts = 'ReceiveAccounts',
    ReceiveAccount = 'ReceiveAccount',
}

export enum SendStackRoutes {
    SendAccounts = 'SendAccounts',
    SendOutputs = 'SendOutputs',
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
    SettingsAppLog = 'SettingsAppLog',
    SettingsNetworks = 'SettingsNetworks',
    SettingsSuiteSync = 'SettingsSuiteSync',
    SettingsAdvanced = 'SettingsAdvanced',
    SettingsDustPhishing = 'SettingsDustPhishing',
    SettingsExperimental = 'SettingsExperimental',
    TurnOffDeviceAuthenticityCheck = 'TurnOffDeviceAuthenticityCheck',
    TurnOffFirmwareAuthenticityCheck = 'TurnOffFirmwareAuthenticityCheck',
    BitcoinBackends = 'BitcoinBackends',
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
    TradingSellOutputsReview = 'TradingSellOutputsReview',
    TradingExchangeOutputsReview = 'TradingExchangeOutputsReview',
    TradingConfirming = 'TradingConfirming',
}

export enum TransactionDetailStackRoutes {
    TransactionDetail = 'TransactionDetail',
    TransactionDetailOverview = 'TransactionDetailOverview',
}

export enum StellarManageTokenStackRoutes {
    TokenSelection = 'TokenSelection',
    ManualTokenInput = 'ManualTokenInput',
    ActivationFee = 'ActivationFee',
    DeactivationFee = 'DeactivationFee',
}
