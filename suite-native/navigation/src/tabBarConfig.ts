import { type TxKeyPath } from '@suite-native/intl';

import { AppTabsRoutes } from './routes';

export const tabBarLabelTxKeys = {
    [AppTabsRoutes.HomeStack]: 'navigation.tabs.home',
    [AppTabsRoutes.AccountsStack]: 'navigation.tabs.accountsList',
    [AppTabsRoutes.TradeStack]: 'navigation.tabs.trade',
    [AppTabsRoutes.EarnStack]: 'navigation.tabs.earn',
    [AppTabsRoutes.Settings]: 'navigation.tabs.settings',
} as const satisfies Record<AppTabsRoutes, TxKeyPath>;

export const tabBarSystemImages = {
    [AppTabsRoutes.HomeStack]: 'house',
    [AppTabsRoutes.AccountsStack]: 'square.stack.3d.up',
    [AppTabsRoutes.TradeStack]: 'arrow.left.arrow.right',
    [AppTabsRoutes.EarnStack]: 'chart.line.uptrend.xyaxis',
    [AppTabsRoutes.Settings]: 'gearshape',
} as const;
