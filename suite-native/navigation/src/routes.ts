export enum RootStackRoutes {
    AppTabs = 'AppTabs',
    Onboarding = 'Onboarding',
    AccountsImport = 'AccountsImport',
    ConnectDevice = 'ConnectDevice',
    AccountDetail = 'AccountDetail',
    DevUtilsStack = 'DevUtilsStack',
    AccountSettings = 'AccountSettings',
    TransactionDetail = 'TransactionDetail',
    ReceiveModal = 'ReceiveModal',
    DeviceInfo = 'DeviceInfo',
    AddCoinAccountStack = 'AddCoinAccountStack',
}

export enum AppTabsRoutes {
    HomeStack = 'HomeStack',
    AccountsStack = 'AccountsStack',
    ReceiveStack = 'ReceiveStack',
    SettingsStack = 'SettingsStack',
}

export enum OnboardingStackRoutes {
    Welcome = 'Welcome',
    TrackBalances = 'TrackBalances',
    AboutReceiveCoinsFeature = 'AboutReceiveCoinsFeature',
    AnalyticsConsent = 'AnalyticsConsent',
    ConnectTrezor = 'ConnectTrezor',
}

export enum AccountsImportStackRoutes {
    SelectNetwork = 'SelectNetwork',
    XpubScan = 'XpubScan',
    XpubScanModal = 'XpubScanModal',
    AccountImportLoading = 'AccountImportLoading',
    AccountImportSummary = 'AccountImportSummary',
}

export enum ConnectDeviceStackRoutes {
    ConnectAndUnlockDevice = 'ConnectAndUnlockDevice',
    PinMatrix = 'PinMatrix',
    ConnectingDevice = 'ConnectingDevice',
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
}

export enum AddCoinAccountStackRoutes {
    AddCoinAccount = 'AddCoinAccount',
    SelectAccountType = 'SelectAccountType',
}

export enum SettingsStackRoutes {
    Settings = 'Settings',
    SettingsLocalization = 'SettingsLocalization',
    SettingsCustomization = 'SettingsCustomization',
    SettingsPrivacyAndSecurity = 'SettingsPrivacyAndSecurity',
    SettingsAbout = 'SettingsAbout',
    SettingsFAQ = 'SettingsFAQ',
}
