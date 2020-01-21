export const MAIN_MENU_ITEMS = [
    { text: 'Dashboard', icon: 'DASHBOARD', route: 'suite-index', isDisabled: false },
    { text: 'Wallet', icon: 'WALLET', route: 'wallet-index', isDisabled: false },
    { text: 'Passwords', icon: 'PASSWORDS', route: 'passwords-index', isDisabled: true },
    { text: 'Exchange', icon: 'EXCHANGE', route: 'exchange-index', isDisabled: true },
    { text: 'Portfolio', icon: 'PORTFOLIO', route: 'portfolio-index', isDisabled: true },
] as const;

export const BOTTOM_MENU_ITEMS = [
    { text: 'Tips', icon: 'TIPS', route: 'tips-index' },
    { text: 'Settings', icon: 'SETTINGS', route: 'settings-index' },
] as const;

export const MENU_PADDING = 10;
