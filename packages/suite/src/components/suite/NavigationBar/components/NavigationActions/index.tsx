import React, { useMemo } from 'react';
import styled from 'styled-components';

import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as suiteActions from '@suite-actions/suiteActions';
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
import { getIsTorEnabled } from '@suite-utils/tor';

import type { Route } from '@suite-types';

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
    padding: 0px 16px;
`;

const Separator = styled.div`
    border: 1px solid ${props => props.theme.STROKE_GREY};
    height: 38px;
    width: 0;
    margin: 0 10px;
    opacity: 0.7;
`;

interface NavigationActionsProps {
    closeMainNavigation?: () => void;
    isMobileLayout?: boolean;
}

export const NavigationActions: React.FC<NavigationActionsProps> = ({
    closeMainNavigation,
    isMobileLayout,
}) => {
    const {
        activeApp,
        notifications,
        discreetMode,
        isTorEnabled,
        allowPrerelease,
        enabledNetworks,
    } = useSelector(state => ({
        activeApp: state.router.app,
        notifications: state.notifications,
        discreetMode: state.wallet.settings.discreetMode,
        isTorEnabled: getIsTorEnabled(state.suite.torStatus),
        theme: state.suite.settings.theme,
        allowPrerelease: state.desktopUpdate.allowPrerelease,
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    const { goto, setDiscreetMode, toggleTor } = useActions({
        goto: routerActions.goto,
        setDiscreetMode: walletSettingsActions.setDiscreetMode,
        toggleTor: suiteActions.toggleTor,
    });

    const { openGuide } = useGuide();

    const WrapperComponent = isMobileLayout ? MobileWrapper : Wrapper;

    const action = (route: Route['name']) => {
        goto(route);
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
                        onClick={() => {
                            toggleTor(!isTorEnabled);
                        }}
                        label={<Translation id="TR_TOR" />}
                        icon="TOR"
                        isMobileLayout
                        marginLeft
                        indicator={isTorEnabled ? 'check' : undefined}
                    />
                ) : (
                    <NavTor isActive={isTorEnabled} />
                ))}

            {allowPrerelease &&
                (isMobileLayout ? (
                    <ActionItem
                        onClick={() => action('settings-index')}
                        label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                        icon="EXPERIMENTAL_FEATURES"
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
