import { FC } from 'react';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.xs};
`;

const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> = [
    {
        nameId: 'TR_DASHBOARD',
        icon: 'home',
        route: 'suite-index',
    },
    {
        nameId: 'TR_NOTIFICATIONS',
        icon: 'notifications',
        CustomComponent: NotificationDropdown,
    },
    {
        nameId: 'TR_SETTINGS',
        icon: 'settings',
        route: 'settings-index',
        dataTest: '@suite/menu/settings',
    },
];

export const Navigation = () => (
    <Nav>
        {navItems.map(item => {
            const Component = item.CustomComponent ? item.CustomComponent : NavigationItem;
            return <Component key={item.nameId} {...item} />;
        })}
    </Nav>
);
