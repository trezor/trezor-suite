import { type FC, useCallback, useMemo } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsInitialRun } from '@suite/flags';
import { type Route } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { NavigationItem, type NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';

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
                    icon: 'house',
                    goToRoute: startRoute,
                    routes: [startRoute],
                    shortcut: ['ALT', 'KEY_0'],
                },
                ...(!isBtcOnly
                    ? [
                          {
                              nameId: 'TR_TRADING_SWAP',
                              icon: 'repeat',
                              goToRoute: 'wallet-trading-exchange',
                              routes: ['wallet-trading-exchange'],
                              onClick: reportSwapNavigation,
                              shortcut: ['ALT', 'KEY_X'],
                          } as NavigationItemProps,
                          {
                              nameId: 'TR_EARN',
                              icon: 'piggyBank',
                              goToRoute: 'suite-earn',
                              shortcut: ['ALT', 'KEY_E'],
                              routes: [
                                  'suite-earn',
                                  'earn-yield-deposit',
                                  'earn-yield-withdraw',
                                  'earn-yield-claim',
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
                    icon: 'bell',
                    CustomComponent: NotificationDropdown,
                    'data-testid': '@suite/menu/notifications',
                    shortcut: ['ALT', 'KEY_I'],
                },
                {
                    nameId: 'TR_SETTINGS',
                    icon: 'gearSix',
                    goToRoute: 'settings-index',
                    routes: SETTINGS_ROUTES,
                    'data-testid': '@suite/menu/settings',
                    shortcut: ['MOD', 'COMMA'],
                },
            ],
            [startRoute, isBtcOnly, reportSwapNavigation],
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
