import { type FC, useCallback, useEffect, useMemo, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import {
    NewContentIndicatorId,
    markNewContentIndicatorAsSeen,
    selectIsInitialRun,
    selectIsNewContentIndicatorVisible,
} from '@suite/flags';
import { type Route, selectRouteName } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasUnseenNotifications } from '@suite-common/toast-notifications';
import { Column } from '@trezor/components';
import { BellIcon, GearSixIcon, HouseIcon, KeyIcon } from '@trezor/icons';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

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

const newContentIndicatorIntro = { hasPlayed: false };

export const Navigation = ({ children }: NavigationProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();

    const isInitialRun = useSelector(selectIsInitialRun);
    const startRoute: Route['name'] = isInitialRun ? 'suite-start' : 'suite-index';

    const hasUnseenNotifications = useSelector(selectHasUnseenNotifications);
    const isActivityNewContentIndicatorVisible = useSelector(
        selectIsNewContentIndicatorVisible(NewContentIndicatorId.Activity26_8),
    );
    const [shouldAnimateNewContentIndicators] = useState(() => !newContentIndicatorIntro.hasPlayed);

    useEffect(() => {
        newContentIndicatorIntro.hasPlayed = true;
    }, []);

    const isActivityOpen = useSelector(selectRouteName) === 'notifications-index';
    const hasActivityIndicator = hasUnseenNotifications && !isActivityOpen;

    const handleActivityNavigation = useCallback(() => {
        if (isActivityNewContentIndicatorVisible) {
            if (!isSidebarCollapsed || !hasActivityIndicator) {
                analytics.report({
                    type: events.appNewContentBadgeEvent.name,
                    payload: {
                        badgeId: NewContentIndicatorId.Activity26_8,
                        origin: 'nav',
                    },
                });
            }

            dispatch(markNewContentIndicatorAsSeen(NewContentIndicatorId.Activity26_8));
        }
    }, [
        analytics,
        dispatch,
        hasActivityIndicator,
        isActivityNewContentIndicatorVisible,
        isSidebarCollapsed,
    ]);

    const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> =
        useMemo(
            // Suite Dark flavour: Earn and Trading are always hidden (Bitcoin-maximalist build).
            () => [
                {
                    nameId: 'TR_DASHBOARD',
                    icon: HouseIcon,
                    goToRoute: startRoute,
                    routes: [startRoute],
                    shortcut: ['MOD', 'ALT', 'KEY_0'],
                },
                {
                    // Suite Dark flavour: promote the password manager to a full left-menu feature.
                    nameId: 'TR_PASSWORDS',
                    icon: KeyIcon,
                    goToRoute: 'password-manager-index',
                    routes: ['password-manager-index'],
                },
                {
                    nameId: 'TR_NOTIFICATIONS',
                    icon: BellIcon,
                    goToRoute: 'notifications-index',
                    routes: ['notifications-index'],
                    hasIndicator: hasActivityIndicator,
                    hasNewContentIndicator: isActivityNewContentIndicatorVisible,
                    isNewContentIndicatorAnimated: shouldAnimateNewContentIndicators,
                    onClick: handleActivityNavigation,
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
            [
                startRoute,
                shouldAnimateNewContentIndicators,
                hasActivityIndicator,
                isActivityNewContentIndicatorVisible,
                handleActivityNavigation,
            ],
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
