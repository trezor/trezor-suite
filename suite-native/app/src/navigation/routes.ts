import { AppTabsRoutes, TabsOptions } from '@suite-native/navigation';

export const rootTabsOptions: TabsOptions = {
    [AppTabsRoutes.HomeStack]: {
        iconName: 'home',
        label: 'Home',
    },
    [AppTabsRoutes.Accounts]: {
        iconName: 'standardWallet',
        label: 'Accounts',
    },
    [AppTabsRoutes.Action]: {
        iconName: 'action',
    },
    [AppTabsRoutes.Prices]: {
        iconName: 'discover',
        label: 'Discover',
    },
    [AppTabsRoutes.SettingsStack]: {
        iconName: 'trezorT',
        label: 'Trezor',
    },
};
