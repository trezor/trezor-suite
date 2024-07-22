import { FC } from 'react';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';
import { useSelector } from 'src/hooks/suite';
import { selectHasExperimentalFeature } from 'src/reducers/suite/suiteReducer';

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.xs};
`;

const PasswordManagerNavItem = (props: NavigationItemProps) => {
    const passwordManagerExperimentalFeature = useSelector(
        selectHasExperimentalFeature('password-manager'),
    );

    return passwordManagerExperimentalFeature ? <NavigationItem {...props} /> : null;
};

const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> = [
    {
        nameId: 'TR_DASHBOARD',
        icon: 'home',
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
        icon: 'settings',
        goToRoute: 'settings-index',
        routes: ['settings-index', 'settings-device', 'settings-coins', 'settings-debug'],
        'data-testid': '@suite/menu/settings',
    },
    {
        nameId: 'TR_PASSWORD_MANAGER',
        icon: 'ghost',
        goToRoute: 'password-manager-index',
        routes: ['password-manager-index'],
        'data-testid': '@suite/menu/password-manager',
        CustomComponent: PasswordManagerNavItem,
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
