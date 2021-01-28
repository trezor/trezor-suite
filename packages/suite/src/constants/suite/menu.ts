export const MAIN_MENU_ITEMS = [
    {
        translationId: 'TR_DASHBOARD',
        icon: 'DASHBOARD',
        route: 'suite-index',
        isDisabled: false,
    },
    {
        translationId: 'TR_WALLET',
        icon: 'WALLET',
        route: 'wallet-index',
        isDisabled: false,
    },
    // {
    //     translationId: 'TR_PASSWORDS',
    //     icon: 'PASSWORDS',
    //     route: 'passwords-index',
    //     isDisabled: true,
    // },
    // {
    //     translationId: 'TR_PORTFOLIO',
    //     icon: 'PORTFOLIO',
    //     route: 'portfolio-index',
    //     isDisabled: true,
    // },
] as const;
