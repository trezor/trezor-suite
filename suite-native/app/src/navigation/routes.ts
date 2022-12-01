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
        params: {
            currencySymbol: undefined,
        },
    },
});

const actionStack = enhanceTabOption({
    routeName: AppTabsRoutes.Action,
    label: 'Receive',
    iconName: 'receive',
});

const settingsStack = enhanceTabOption({
    routeName: AppTabsRoutes.SettingsStack,
    iconName: 'settings',
    label: 'Trezor',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...actionStack,
    ...settingsStack,
};
