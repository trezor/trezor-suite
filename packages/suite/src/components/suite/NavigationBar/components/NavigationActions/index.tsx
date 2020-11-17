import React from 'react';
import styled from 'styled-components';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components';
import { Icon, Tooltip, useTheme } from '@trezor/components';
import { findRouteByName } from '@suite-utils/router';
import { BOTTOM_MENU_ITEMS } from '@suite-constants/menu';
import { useActions, useAnalytics, useSelector } from '@suite-hooks';
import ActionItem from './components/ActionItem';
import TooltipContentTor from './components/TooltipContentTor';
import { isDesktop } from '@suite-utils/env';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    width: 288px; /* same as DeviceSelector because we need menu in the exact center  */
    justify-content: flex-end;
`;

const MobileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0px 16px;
`;

const ActionsContainer = styled.div<{ desktop: boolean; mobileLayout?: boolean }>`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    ${props =>
        !props.mobileLayout &&
        `display: flex;
        align-items: center;
        margin-left: 28px;
        border-top: 0;
    `}
    ${props =>
        props.desktop &&
        !props.mobileLayout &&
        `
        margin-left: 22px;
        margin-right: -17px;
        padding: 12px 15px;
        border: 1px solid ${props.theme.STROKE_GREY};
        border-radius: 10px;
    `}
`;

const ActionItemTor = styled.div<{ mobileLayout?: boolean }>`
    ${props =>
        !props.mobileLayout &&
        `display: flex;
        position: relative;
        align-items: center;
        margin-left: 17px;
    `}
    ${props =>
        props.mobileLayout &&
        `border-top: 1px solid ${props.theme.STROKE_GREY};
    `}
`;

const ActionItemTorIndicator = styled.div`
    background: ${props => props.theme.BG_WHITE};
    display: flex;
    align-items: center;
    height: 10px;
    width: 10px;
    border-radius: 50%;
    position: absolute;
    top: 0;
    right: 0;
`;

interface Props {
    closeMainNavigation?: () => void;
    isMobileLayout?: boolean;
}

type Route = typeof BOTTOM_MENU_ITEMS[number]['route'];

const NavigationActions = (props: Props) => {
    const analytics = useAnalytics();
    const themeColors = useTheme();
    const { activeApp, notifications, discreetMode, tor } = useSelector(state => ({
        activeApp: state.router.app,
        notifications: state.notifications,
        discreetMode: state.wallet.settings.discreetMode,
        tor: state.suite.tor,
        theme: state.suite.settings.theme,
    }));
    const { goto, setDiscreetMode } = useActions({
        goto: routerActions.goto,
        setDiscreetMode: walletSettingsActions.setDiscreetMode,
        setTheme: suiteActions.setTheme,
    });

    const WrapperComponent = props.isMobileLayout ? MobileWrapper : Wrapper;

    const gotoWithReport = (routeName: Route) => {
        if (routeName === 'notifications-index') {
            analytics.report({ type: 'menu/goto/notifications-index' });
        } else if (routeName === 'settings-index') {
            analytics.report({ type: 'menu/goto/settings-index' });
        }
        goto(routeName);
    };

    const action = (route: Route) => {
        gotoWithReport(route);
        if (props.closeMainNavigation) props.closeMainNavigation();
    };

    return (
        <WrapperComponent>
            {BOTTOM_MENU_ITEMS.map(item => {
                const { route, icon } = item;
                const dataTestId = `@suite/menu/${route}`;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === activeApp : false;
                const unseenNotifications = notifications.some(n => !n.seen);

                return (
                    <ActionItem
                        key={item.translationId}
                        label={<Translation id={item.translationId} />}
                        data-test={dataTestId}
                        onClick={() => action(route)}
                        isActive={isActive}
                        icon={icon}
                        withAlertDot={
                            !isActive && route === 'notifications-index' && unseenNotifications
                        }
                        isMobileLayout={props.isMobileLayout}
                    />
                );
            })}
            <ActionsContainer desktop={isDesktop()} mobileLayout={props.isMobileLayout}>
                <ActionItem
                    onClick={() => {
                        analytics.report({
                            type: 'menu/toggle-discreet',
                            payload: {
                                value: !discreetMode,
                            },
                        });
                        setDiscreetMode(!discreetMode);
                    }}
                    isActive={discreetMode}
                    label={<Translation id="TR_DISCREET" />}
                    icon={discreetMode ? 'HIDE' : 'SHOW'}
                    isMobileLayout={props.isMobileLayout}
                />
                {isDesktop() && (
                    <ActionItemTor mobileLayout={props.isMobileLayout}>
                        <Tooltip
                            placement="bottom"
                            content={
                                <TooltipContentTor
                                    active={tor}
                                    action={() => action('settings-index')}
                                />
                            }
                            {...props}
                        >
                            <>
                                <ActionItem
                                    onClick={() => {
                                        analytics.report({
                                            type: 'menu/toggle-tor',
                                            payload: {
                                                value: !tor,
                                            },
                                        });
                                        window.desktopApi!.toggleTor(!tor);
                                    }}
                                    isActive={tor}
                                    label={<Translation id="TR_TOR" />}
                                    icon="TOR"
                                    isMobileLayout={props.isMobileLayout}
                                />
                                {tor && (
                                    <ActionItemTorIndicator>
                                        <Icon
                                            icon="CHECK"
                                            size={10}
                                            color={themeColors.TYPE_GREEN}
                                        />
                                    </ActionItemTorIndicator>
                                )}
                            </>
                        </Tooltip>
                    </ActionItemTor>
                )}
            </ActionsContainer>
        </WrapperComponent>
    );
};

export default NavigationActions;
