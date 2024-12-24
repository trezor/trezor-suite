import { AccountsStackRoutes, AppTabsRoutes } from '@suite-native/navigation';

import { enhanceTabOption } from './enhanceTabOption';

const homeStack = enhanceTabOption({
    routeName: AppTabsRoutes.HomeStack,
    iconName: 'house',
    focusedIconName: 'houseFilled',
    label: 'Home',
});

const accountsStack = enhanceTabOption({
    routeName: AppTabsRoutes.AccountsStack,
    iconName: 'discover',
    focusedIconName: 'discoverFilled',
    label: 'My assets',
    params: {
        screen: AccountsStackRoutes.Accounts,
    },
});

const receiveStack = enhanceTabOption({
    routeName: AppTabsRoutes.ReceiveStack,
    label: 'Receive',
    iconName: 'arrowLineDown',
    focusedIconName: 'arrowLineDown',
});

const settings = enhanceTabOption({
    routeName: AppTabsRoutes.Settings,
    iconName: 'gear',
    focusedIconName: 'gearFilled',
    label: 'Settings',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...receiveStack,
    ...settings,
};
