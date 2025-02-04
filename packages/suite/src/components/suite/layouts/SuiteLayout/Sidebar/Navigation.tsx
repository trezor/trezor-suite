import { FC } from 'react';

import styled from 'styled-components';

import { Route } from '@suite-common/suite-types';
import { spacingsPx } from '@trezor/theme';

import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

export const Nav = styled.nav<{ $isSidebarCollapsed: boolean }>`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.xs};
    align-items: stretch;

    ${({ $isSidebarCollapsed }) => $isSidebarCollapsed && `align-items: center;`}
`;

export const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
] as const;

const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> = [
    {
        nameId: 'TR_DASHBOARD',
        icon: 'house',
        goToRoute: 'suite-index',
        routes: ['suite-index'],
    },
    {
        nameId: 'TR_NOTIFICATIONS',
        icon: 'notifications',
        CustomComponent: NotificationDropdown,
    },
    {
        nameId: 'TR_SETTINGS',
        icon: 'gearSix',
        goToRoute: 'settings-index',
        routes: SETTINGS_ROUTES,
        'data-testid': '@suite/menu/settings',
    },
];

export const Navigation = () => {
    const { isSidebarCollapsed } = useResponsiveContext();

    return (
        <Nav $isSidebarCollapsed={isSidebarCollapsed}>
            {navItems.map(item => {
                const Component = item.CustomComponent ? item.CustomComponent : NavigationItem;

                return <Component key={item.nameId} {...item} />;
            })}
        </Nav>
    );
};
