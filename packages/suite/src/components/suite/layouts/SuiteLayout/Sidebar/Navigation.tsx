import { FC, useMemo } from 'react';

import styled from 'styled-components';

import { selectIsInitialRun } from '@suite/flags';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { Route } from '@suite-common/suite-types';
import { selectIsAnyNonBitcoinLikeNetworkEnabled } from '@suite-common/wallet-core';
import { type SpacingPxValues, spacingsPx } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

export const Nav = styled.nav<{ $isSidebarCollapsed: boolean; $margin: SpacingPxValues }>`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    align-items: stretch;

    ${({ $margin }) => $margin && `margin: ${$margin};`}
    ${({ $isSidebarCollapsed }) => $isSidebarCollapsed && `align-items: center;`}
`;

export const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
    'settings-connected-apps',
] as const;

type NavigationProps = {
    children?: React.ReactNode;
    margin?: SpacingPxValues;
};

export const Navigation = ({ children, margin = spacingsPx.xs }: NavigationProps) => {
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
                },
            ],
            [startRoute, isDebug, isBtcOnly, hasNonBitcoinEnabled],
        );

    return (
        <Nav $isSidebarCollapsed={isSidebarCollapsed} $margin={margin}>
            {children ?? null}
            {navItems.map(item => {
                const Component = item.CustomComponent ? item.CustomComponent : NavigationItem;

                return <Component key={item.nameId} {...item} />;
            })}
        </Nav>
    );
};
