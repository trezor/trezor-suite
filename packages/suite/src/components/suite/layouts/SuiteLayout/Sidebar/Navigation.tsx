import { type FC, useMemo } from 'react';

import { selectIsInitialRun } from '@suite/flags';
import { type Route } from '@suite/router';
import { selectIsDebugModeActive } from '@suite/settings';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectIsAnyNonBitcoinLikeNetworkEnabled } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { NavigationItem, type NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';
import { SettingsWithTooltip } from './SettingsWithTooltip';

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

    const isInitialRun = useSelector(selectIsInitialRun);
    const startRoute: Route['name'] = isInitialRun ? 'suite-start' : 'suite-index';

    const isDebug = useSelector(selectIsDebugModeActive);
    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);
    const hasNonBitcoinEnabled = useSelector(selectIsAnyNonBitcoinLikeNetworkEnabled);

    const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> =
        useMemo(
            () => [
                {
                    nameId: 'TR_DASHBOARD',
                    icon: 'house',
                    goToRoute: startRoute,
                    routes: [startRoute],
                },
                ...(isDebug && !isBtcOnly && hasNonBitcoinEnabled
                    ? [
                          {
                              nameId: 'TR_EARN',
                              icon: 'piggyBank',
                              goToRoute: 'suite-earn',
                              routes: ['suite-earn', 'earn-supply', 'earn-withdraw'],
                          } as NavigationItemProps,
                      ]
                    : []),
                {
                    nameId: 'TR_NOTIFICATIONS',
                    icon: 'bell',
                    CustomComponent: NotificationDropdown,
                },
                {
                    nameId: 'TR_SETTINGS',
                    icon: 'gearSix',
                    goToRoute: 'settings-index',
                    routes: SETTINGS_ROUTES,
                    'data-testid': '@suite/menu/settings',
                    CustomComponent: SettingsWithTooltip,
                },
            ],
            [startRoute, isDebug, isBtcOnly, hasNonBitcoinEnabled],
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
