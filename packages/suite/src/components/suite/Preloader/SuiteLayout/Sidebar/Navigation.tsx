import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
`;

export const Navigation = () => {
    const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> =
        useMemo(
            () => [
                {
                    id: 'dashboard',
                    nameId: 'TR_DASHBOARD',
                    icon: 'home',
                    route: 'suite-index',
                },
                {
                    id: 'notifications',
                    nameId: 'TR_NOTIFICATIONS',
                    icon: 'notifications',
                    CustomComponent: NotificationDropdown,
                },
                {
                    id: 'settings',
                    nameId: 'TR_SETTINGS',
                    icon: 'settings',
                    route: 'settings-index',
                    dataTest: 'settings',
                },
            ],
            [],
        );

    return (
        <Nav>
            {navItems.map(item =>
                item.CustomComponent ? (
                    <item.CustomComponent key={item.nameId} {...item} />
                ) : (
                    <NavigationItem key={item.nameId} {...item} />
                ),
            )}
        </Nav>
    );
};
