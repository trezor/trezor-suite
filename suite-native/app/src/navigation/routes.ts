import { AccountsStackRoutes, AppTabsRoutes } from '@suite-native/navigation';

import { enhanceTabOption } from './enhanceTabOption';

const homeStack = enhanceTabOption({
    routeName: AppTabsRoutes.HomeStack,
    iconName: 'house',
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
    iconName: 'arrowLineDown',
});

const settingsStack = enhanceTabOption({
    routeName: AppTabsRoutes.SettingsStack,
    iconName: 'gear',
    label: 'Settings',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...receiveStack,
    ...settingsStack,
};
