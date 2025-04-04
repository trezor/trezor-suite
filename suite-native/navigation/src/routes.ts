export enum RootStackRoutes {
    AppTabs = 'AppTabs',
    LegacyOnboarding = 'LegacyOnboarding',
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
    WalletConnectSessionPopup = 'WalletConnectSessionPopup',
    WalletConnectPair = 'WalletConnectPair',
    SettingsScreenStack = 'SettingsScreenStack',
    DeviceCompromisedModal = 'DeviceCompromisedModal',
    TradingWebView = 'TradingWebView',
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
    ConnectAndUnlockDevice = 'ConnectAndUnlockDevice',
    UninitializedDeviceLanding = 'UninitializedDeviceLanding',
    SuspiciousDevice = 'SuspiciousDevice',
    SecurityCheck = 'SecurityCheck',
    FirmwareInstallation = 'FirmwareInstallation',
    ConfirmFirmwareUpdate = 'ConfirmFirmwareUpdate',
    DeviceTutorial = 'DeviceTutorial',
    CreateOrRecoverCrossroads = 'CreateOrRecoverCrossroads',
    CreateWalletLoading = 'CreateWalletLoading',
    WalletBackupTutorial = 'WalletBackupTutorial',
    WalletCreation = 'WalletCreation',
}

export enum AccountsImportStackRoutes {
    SelectNetwork = 'SelectNetwork',
    XpubScan = 'XpubScan',
    AccountImportLoading = 'AccountImportLoading',
    AccountImportSummary = 'AccountImportSummary',
}

export enum DeviceStackRoutes {
    DeviceSettings = 'DeviceSettings',
    DevicePinProtection = 'DevicePinProtection',
    DeviceAuthenticity = 'DeviceAuthenticity',
    ConfirmFirmwareUpdate = 'ConfirmFirmwareUpdate',
    FirmwareInstallation = 'FirmwareInstallation',
    ContinueOnTrezor = 'ContinueOnTrezor',
}

export enum DevicePinProtectionStackRoutes {
    ContinueOnTrezor = 'ContinueOnTrezor',
    EnterCurrentPin = 'EnterCurrentPin',
    EnterNewPin = 'EnterNewPin',
    ConfirmNewPin = 'ConfirmNewPin',
}

export enum DeviceAuthenticityStackRoutes {
    AuthenticityCheck = 'AuthenticityCheck',
    AuthenticitySummary = 'AuthenticitySummary',
}

export enum AuthorizeDeviceStackRoutes {
    ConnectAndUnlockDevice = 'ConnectAndUnlockDevice',
    PinMatrix = 'PinMatrix',
    ConnectingDevice = 'ConnectingDevice',

    PassphraseForm = 'PassphraseForm',
    PassphraseConfirmOnTrezor = 'PassphraseConfirmOnTrezor',
    PassphraseLoading = 'PassphraseLoading',
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
    ReceiveAccounts = 'ReceiveAccounts',
    ReceiveAccount = 'ReceiveAccount',
}

export enum SendStackRoutes {
    SendAccounts = 'SendAccounts',
    SendOutputs = 'SendOutputs',
    SendFees = 'SendFees',
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
    SettingsLocalization = 'SettingsLocalization',
    SettingsCustomization = 'SettingsCustomization',
    SettingsPrivacyAndSecurity = 'SettingsPrivacyAndSecurity',
    SettingsViewOnly = 'SettingsViewOnly',
    SettingsAbout = 'SettingsAbout',
    SettingsFAQ = 'SettingsFAQ',
    SettingsCoinEnabling = 'SettingsCoinEnabling',
    SettingsDeviceChecks = 'SettingsDeviceChecks',
    TurnOffFirmwareAuthenticityCheckModal = 'TurnOffFirmwareAuthenticityCheckModal',
}

export enum TradingStackRoutes {
    Trading = 'Trading',
    ReceiveAccounts = 'ReceiveAccounts',
}
