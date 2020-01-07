export const MAIN_MENU_ITEMS = [
    { text: 'Dashboard', icon: 'DASHBOARD', route: 'suite-index' },
    { text: 'Wallet', icon: 'WALLET', route: 'wallet-index' },
    { text: 'Passwords', icon: 'PASSWORDS', route: 'passwords-index' },
    { text: 'Exchange', icon: 'EXCHANGE', route: 'exchange-index' },
] as const;

export const BOTTOM_MENU_ITEMS = [
    { text: 'Tips', icon: 'TIPS', route: 'tips-index' },
    { text: 'Settings', icon: 'SETTINGS', route: 'settings-index' },
] as const;

export const MENU_PADDING = 10;
