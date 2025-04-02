export enum TestAnnotationType {
    TestCase = 'testcase',
    Prerequisites = 'prerequisites',
    Steps = 'steps',
    Category = 'category',
    Priority = 'priority',
    Stream = 'stream',
    OsMatrix = 'os_matrix',
    DeviceMatrix = 'device_matrix',
}

export enum TestCategory {
    Onboarding = 'Onboarding',
    UriLinkHandler = 'URI link handler',
    Wallets = 'Wallets',
    Dashboard = 'Dashboard',
    Security = 'Security',
    SuiteGuide = 'Suite Guide',
    Feedback = 'Feedback',
    Accounts = 'Accounts',
    Coins = 'Coins',
    BTC = 'BTC',
    LTC = 'LTC',
    ETH = 'ETH',
    TradeTab = 'Trade Tab',
    Notifications = 'Notifications',
    Application = 'Application',
    Device = 'Device',
    Settings = 'Settings',
    General = 'General',
    VTC = 'VTC',
    ADA = 'ADA',
    BTV = 'BTV',
    Firmware = 'Firmware',
    CoinJoin = 'CoinJoin',
    Staking = 'Staking',
    Solana = 'Solana',
    Engagement = 'Engagement',
}

export enum TestPriority {
    Critical = 'Critical',
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    AsNecessary = 'As necessary',
}

export enum TestStream {
    Trends = 'Trends',
    Foundation = 'Foundation',
    Engagement = 'Engagement',
    Firmware = 'Firmware',
}
