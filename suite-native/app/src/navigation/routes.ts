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
    label: 'My Assets',
    params: {
        screen: AccountsStackRoutes.Accounts,
    },
});

const receiveScreen = enhanceTabOption({
    routeName: AppTabsRoutes.ReceiveScreen,
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
    ...receiveScreen,
    ...settingsStack,
};
