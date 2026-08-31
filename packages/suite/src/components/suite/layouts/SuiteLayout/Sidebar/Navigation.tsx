import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import {
    NewContentIndicatorId,
    markNewContentIndicatorAsSeen,
    selectIsInitialRun,
    selectIsNewContentIndicatorVisible,
} from '@suite/flags';
import { type Route, selectRouteName } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { selectHasUnseenTransactionNotifications } from '@suite-common/toast-notifications';
import { Column } from '@trezor/components';
import { BellIcon, GearSixIcon, HouseIcon, PiggyBankIcon, RepeatIcon } from '@trezor/icons';

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

    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);

    const hasUnseenNotifications = useSelector(selectHasUnseenTransactionNotifications);
    const isActivityNewContentIndicatorVisible = useSelector(
        selectIsNewContentIndicatorVisible(NewContentIndicatorId.Activity26_8),
    );
    const isEarnNewContentIndicatorVisible = useSelector(
        selectIsNewContentIndicatorVisible(NewContentIndicatorId.Earn26_8),
    );
    const [shouldAnimateNewContentIndicators] = useState(() => !newContentIndicatorIntro.hasPlayed);

    useEffect(() => {
        newContentIndicatorIntro.hasPlayed = true;
    }, []);

    const isActivityOpen = useSelector(selectRouteName) === 'notifications-index';
    const hasActivityIndicator = hasUnseenNotifications && !isActivityOpen;

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

    const handleEarnNavigation = useCallback(() => {
        if (isEarnNewContentIndicatorVisible) {
            analytics.report({
                type: events.appNewContentBadgeEvent.name,
                payload: {
                    badgeId: NewContentIndicatorId.Earn26_8,
                    origin: 'nav',
                },
            });

            dispatch(markNewContentIndicatorAsSeen(NewContentIndicatorId.Earn26_8));
        }
    }, [analytics, dispatch, isEarnNewContentIndicatorVisible]);

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
                              hasNewContentIndicator: isEarnNewContentIndicatorVisible,
                              isNewContentIndicatorAnimated: shouldAnimateNewContentIndicators,
                              onClick: handleEarnNavigation,
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
                isBtcOnly,
                reportSwapNavigation,
                isEarnNewContentIndicatorVisible,
                shouldAnimateNewContentIndicators,
                handleEarnNavigation,
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
