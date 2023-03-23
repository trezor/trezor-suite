import { AccountsStackRoutes, AppTabsRoutes } from '@suite-native/navigation';

import { enhanceTabOption } from './enhanceTabOption';

const homeStack = enhanceTabOption({
    routeName: AppTabsRoutes.HomeStack,
    iconName: 'home',
    label: 'Home',
});

const accountsStack = enhanceTabOption({
    routeName: AppTabsRoutes.AccountsStack,
    iconName: 'discover',
    label: 'My Coins',
    params: {
        screen: AccountsStackRoutes.Accounts,
    },
});

const sendReceiveStack = enhanceTabOption({
    routeName: AppTabsRoutes.SendReceiveStack,
    label: 'Receive',
    iconName: 'receive',
});

const settingsStack = enhanceTabOption({
    routeName: AppTabsRoutes.SettingsStack,
    iconName: 'settings',
    label: 'Settings',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...sendReceiveStack,
    ...settingsStack,
};
