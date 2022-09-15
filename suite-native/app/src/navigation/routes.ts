import { AppTabsRoutes, TabsOptions } from '@suite-native/navigation';

export const rootTabsOptions: TabsOptions = {
    [AppTabsRoutes.HomeStack]: {
        iconName: 'home',
        label: 'Home',
    },
    [AppTabsRoutes.AccountsStack]: {
        iconName: 'discover',
        label: 'My Assets',
    },
    [AppTabsRoutes.Action]: {
        iconName: 'action',
    },
    [AppTabsRoutes.Prices]: {
        iconName: 'prices',
        label: 'Discover',
    },
    [AppTabsRoutes.SettingsStack]: {
        iconName: 'trezorT',
        label: 'Trezor',
    },
};
