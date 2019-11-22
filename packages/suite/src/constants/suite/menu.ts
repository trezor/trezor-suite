export const MAIN_MENU_ITEMS = [
    { text: 'Dashboard', icon: 'DASHBOARD', route: 'dashboard-index' },
    { text: 'Wallet', icon: 'WALLET', route: 'wallet-index' },
    { text: 'Passwords', icon: 'PASSWORDS', route: 'passwords-index' },
    { text: 'Exchange', icon: 'EXCHANGE', route: 'exchange-index' },
] as const;

export const BOTTOM_MENU_ITEMS = [
    { text: 'Tips', icon: 'TIPS', route: 'dashboard-index' },
    { text: 'Settings', icon: 'SETTINGS', route: 'dashboard-index' },
] as const;

export const MENU_PADDING = 10;
