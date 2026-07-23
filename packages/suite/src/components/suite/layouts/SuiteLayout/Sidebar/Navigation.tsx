import { type FC, useCallback, useMemo } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsInitialRun } from '@suite/flags';
import { type Route } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { Column } from '@trezor/components';
import { BellIcon, GearSixIcon, HouseIcon, PiggyBankIcon, RepeatIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { isTransactionNotification } from 'src/utils/suite/notification';

import { NavigationItem, type NavigationItemProps } from './NavigationItem';

export const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
    'settings-connected-apps',
] as const;

type NavigationProps = {
    children?: React.ReactNode;
};

export const Navigation = ({ children }: NavigationProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const isInitialRun = useSelector(selectIsInitialRun);
    const startRoute: Route['name'] = isInitialRun ? 'suite-start' : 'suite-index';

    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);

    const hasUnseenNotifications = useSelector(state =>
        state.notifications.some(
            notification => !notification.seen && isTransactionNotification(notification),
        ),
    );

    const reportSwapNavigation = useCallback(() => {
        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'exchange',
                from: 'sidebar',
            },
        });
    }, [analytics]);

    const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> =
        useMemo(
            () => [
                {
                    nameId: 'TR_DASHBOARD',
                    icon: HouseIcon,
                    goToRoute: startRoute,
                    routes: [startRoute],
                    shortcut: ['MOD', 'ALT', 'KEY_0'],
                },
                ...(!isBtcOnly
                    ? [
                          {
                              nameId: 'TR_TRADING_SWAP',
                              icon: RepeatIcon,
                              goToRoute: 'wallet-trading-exchange',
                              routes: ['wallet-trading-exchange'],
                              onClick: reportSwapNavigation,
                              shortcut: ['ALT', 'KEY_X'],
                          } as NavigationItemProps,
                          {
                              nameId: 'TR_EARN',
                              icon: PiggyBankIcon,
                              goToRoute: 'suite-earn',
                              shortcut: ['ALT', 'KEY_E'],
                              routes: [
                                  'suite-earn',
                                  'earn-yield-deposit',
                                  'earn-yield-withdraw',
                                  'earn-yield-claim',
                                  'earn-yield-unwrap',
                                  'earn-yield-wrap',
                                  'earn-tron',
                                  'earn-tron-stake',
                                  'earn-tron-vote',
                                  'earn-tron-unstake',
                                  'earn-tron-withdraw',
                                  'earn-tron-claim',
                              ],
                          } as NavigationItemProps,
                      ]
                    : []),
                {
                    nameId: 'TR_NOTIFICATIONS',
                    icon: BellIcon,
                    goToRoute: 'notifications-index',
                    routes: ['notifications-index'],
                    hasIndicator: hasUnseenNotifications,
                    'data-testid': '@suite/menu/notifications',
                    shortcut: ['ALT', 'KEY_I'],
                },
                {
                    nameId: 'TR_SETTINGS',
                    icon: GearSixIcon,
                    goToRoute: 'settings-index',
                    routes: SETTINGS_ROUTES,
                    'data-testid': '@suite/menu/settings',
                    shortcut: ['MOD', 'COMMA'],
                },
            ],
            [startRoute, isBtcOnly, reportSwapNavigation, hasUnseenNotifications],
        );

    return (
        <Column alignItems={isSidebarCollapsed ? 'center' : 'stretch'} gap={4} margin={8} as="nav">
            {children ?? null}
            {navItems.map(item => {
                const Component = item.CustomComponent ? item.CustomComponent : NavigationItem;

                return <Component key={item.nameId} {...item} />;
            })}
        </Column>
    );
};
