import { AccountsStackRoutes, AppTabsRoutes } from '@suite-native/navigation';

import { typedTabOption } from './typedTabOption';

const homeStack = typedTabOption({
    routeName: AppTabsRoutes.HomeStack,
    iconName: 'home',
    label: 'Home',
});

const accountsStack = typedTabOption({
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

const actionStack = typedTabOption({
    routeName: AppTabsRoutes.Action,
    label: 'Receive',
    iconName: 'action',
});

const settingsStack = typedTabOption({
    routeName: AppTabsRoutes.SettingsStack,
    iconName: 'trezorT',
    label: 'Trezor',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...actionStack,
    ...settingsStack,
};
