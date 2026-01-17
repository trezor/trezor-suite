import { AccountsStackRoutes, AppTabsRoutes } from '@suite-native/navigation';

import { enhanceTabOption } from './enhanceTabOption';

const homeStack = enhanceTabOption({
    routeName: AppTabsRoutes.HomeStack,
    iconName: 'house',
    focusedIconName: 'houseFilled',
});

const accountsStack = enhanceTabOption({
    routeName: AppTabsRoutes.AccountsStack,
    iconName: 'discover',
    focusedIconName: 'discoverFilled',
    params: {
        screen: AccountsStackRoutes.Accounts,
    },
});

const earnStack = enhanceTabOption({
    routeName: AppTabsRoutes.EarnStack,
    iconName: 'piggyBank',
    focusedIconName: 'piggyBankFilled',
});

const tradeStack = enhanceTabOption({
    routeName: AppTabsRoutes.TradeStack,
    iconName: 'arrowsLeftRight',
    focusedIconName: 'arrowsLeftRight',
});

const settings = enhanceTabOption({
    routeName: AppTabsRoutes.Settings,
    iconName: 'gear',
    focusedIconName: 'gearFilled',
});

export const rootTabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...earnStack,
    ...tradeStack,
    ...settings,
};
