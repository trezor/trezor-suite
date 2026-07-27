import { AccountsStackRoutes, AppTabsRoutes, type TabsOptions } from '@suite-native/navigation';

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
    iconName: 'repeat',
    focusedIconName: 'repeat',
});

const settings = enhanceTabOption({
    routeName: AppTabsRoutes.Settings,
    iconName: 'gear',
    focusedIconName: 'gearFilled',
});

export const rootTabsOptionsWithoutEarn: TabsOptions = {
    ...homeStack,
    ...accountsStack,
    ...tradeStack,
    ...settings,
};

export const rootTabsOptions: TabsOptions = {
    ...rootTabsOptionsWithoutEarn,
    ...earnStack,
};
