import React, { useMemo } from 'react';
import styled from 'styled-components';

import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components';
import { findRouteByName } from '@suite-utils/router';
import { useActions, useSelector } from '@suite-hooks';
import { useCustomBackends } from '@settings-hooks/backends';
import { ActionItem } from './components/ActionItem';
import { isDesktop } from '@suite-utils/env';
import { NavTor } from './components/NavTor';
import { NavEarlyAccess } from './components/NavEarlyAccess';
import { NavNotifications } from './components/NavNotifications';
import { NavSettings } from './components/NavSettings';
import { variables } from '@trezor/components';
import { NavBackends } from './components/NavBackends';
import { useGuide } from '@guide-hooks/useGuide';
import { SettingsAnchor } from '@suite-constants/anchors';

import type { Route } from '@suite-types';
import { selectTorState } from '@suite-reducers/suiteReducer';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    min-width: 288px; /* same as DeviceSelector because we need menu in the exact center  */
    justify-content: flex-end;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        margin-left: 24px;
    }
`;

const MobileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 16px;
`;

const Separator = styled.div`
    border: 1px solid ${props => props.theme.STROKE_GREY};
    height: 38px;
    width: 0;
    margin: 0 10px;
    opacity: 0.7;
`;

const getTorIndicator = (isActive: boolean, isLoading: boolean) => {
    if (isActive) {
        return 'check';
    }

    if (isLoading) {
        return 'loading';
    }
};

interface NavigationActionsProps {
    closeMainNavigation?: () => void;
    isMobileLayout?: boolean;
}

export const NavigationActions = ({
    closeMainNavigation,
    isMobileLayout,
}: NavigationActionsProps) => {
    const { isTorEnabled, isTorLoading } = useSelector(selectTorState);
    const { activeApp, notifications, discreetMode, allowPrerelease, enabledNetworks } =
        useSelector(state => ({
            activeApp: state.router.app,
            notifications: state.notifications,
            discreetMode: state.wallet.settings.discreetMode,
            theme: state.suite.settings.theme,
            allowPrerelease: state.desktopUpdate.allowPrerelease,
            enabledNetworks: state.wallet.settings.enabledNetworks,
        }));

    const { goto, setDiscreetMode } = useActions({
        goto: routerActions.goto,
        setDiscreetMode: walletSettingsActions.setDiscreetMode,
    });

    const { openGuide } = useGuide();

    const WrapperComponent = isMobileLayout ? MobileWrapper : Wrapper;

    const action = (...gotoArgs: Parameters<typeof goto>) => {
        goto(...gotoArgs);
        if (closeMainNavigation) closeMainNavigation();
    };

    const handleOpenGuide = () => {
        closeMainNavigation?.();
        openGuide();
    };

    const getIfRouteIsActive = (route: Route['name']) => {
        const routeObj = findRouteByName(route);
        return routeObj ? routeObj.app === activeApp : false;
    };

    const unseenNotifications = useMemo(() => notifications.some(n => !n.seen), [notifications]);

    const customBackends = useCustomBackends().filter(backend =>
        enabledNetworks.includes(backend.coin),
    );

    return (
        <WrapperComponent>
            <ActionItem
                onClick={() => setDiscreetMode(!discreetMode)}
                isActive={discreetMode}
                label={<Translation id="TR_DISCREET" />}
                icon={discreetMode ? 'HIDE' : 'SHOW'}
                isMobileLayout={isMobileLayout}
            />

            {!!customBackends.length &&
                (isMobileLayout ? (
                    <ActionItem
                        onClick={() => action('settings-coins')}
                        label={<Translation id="TR_BACKENDS" />}
                        icon="BACKEND"
                        isMobileLayout
                        indicator="check"
                    />
                ) : (
                    <NavBackends customBackends={customBackends} />
                ))}

            {isDesktop() &&
                (isMobileLayout ? (
                    <ActionItem
                        onClick={() => action('settings-index', { anchor: SettingsAnchor.Tor })}
                        label={<Translation id="TR_TOR" />}
                        icon="TOR"
                        isMobileLayout
                        marginLeft
                        indicator={getTorIndicator(isTorEnabled, isTorLoading)}
                    />
                ) : (
                    <NavTor indicator={getTorIndicator(isTorEnabled, isTorLoading)} />
                ))}

            {allowPrerelease &&
                (isMobileLayout ? (
                    <ActionItem
                        onClick={() => action('settings-index')}
                        label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                        icon="EXPERIMENTAL"
                        isMobileLayout
                    />
                ) : (
                    <NavEarlyAccess isActive />
                ))}

            {!isMobileLayout && <Separator />}

            {isMobileLayout ? (
                <ActionItem
                    label={<Translation id="TR_NOTIFICATIONS" />}
                    data-test="@suite/menu/notifications-index"
                    onClick={() => action('notifications-index')}
                    isActive={getIfRouteIsActive('notifications-index')}
                    icon="NOTIFICATION"
                    indicator={unseenNotifications ? 'alert' : undefined}
                    isMobileLayout
                />
            ) : (
                <NavNotifications
                    indicator={unseenNotifications}
                    isActive={getIfRouteIsActive('notifications-index')}
                />
            )}

            {isMobileLayout && (
                <ActionItem
                    label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />}
                    data-test="@suite/menu/guide-index"
                    onClick={handleOpenGuide}
                    icon="LIGHTBULB"
                    isMobileLayout
                />
            )}

            {isMobileLayout ? (
                <ActionItem
                    label={<Translation id="TR_SETTINGS" />}
                    data-test="@suite/menu/settings-index"
                    onClick={() => action('settings-index')}
                    isActive={getIfRouteIsActive('settings-index')}
                    icon="SETTINGS"
                    isMobileLayout
                />
            ) : (
                <NavSettings isActive={getIfRouteIsActive('settings-index')} />
            )}
        </WrapperComponent>
    );
};
