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
    label: 'My assets',
    params: {
        screen: AccountsStackRoutes.Accounts,
    },
});

const receiveStack = enhanceTabOption({
    routeName: AppTabsRoutes.ReceiveStack,
    label: 'Receive',
    iconName: 'arrowDownLight',
});

const settingsStack = enhanceTabOption({
    routeName: AppTabsRoutes.SettingsStack,
    iconName: 'settings',
    label: 'Settings',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...receiveStack,
    ...settingsStack,
};
