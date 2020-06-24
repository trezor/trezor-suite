import React from 'react';
import styled from 'styled-components';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components';
import { findRouteByName } from '@suite-utils/router';
import { BOTTOM_MENU_ITEMS } from '@suite-constants/menu';
import { useActions, useAnalytics, useSelector } from '@suite-hooks';
import ActionItem from './components/ActionItem';

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

interface Props {
    closeMainNavigation?: () => void;
    isMobileLayout?: boolean;
}

const NavigationActions = (props: Props) => {
    const analytics = useAnalytics();
    const activeApp = useSelector(state => state.router.app);
    const notifications = useSelector(state => state.notifications);
    const discreetMode = useSelector(state => state.wallet.settings.discreetMode);
    const { goto, setDiscreetMode } = useActions({
        goto: routerActions.goto,
        setDiscreetMode: walletSettingsActions.setDiscreetMode,
    });

    const WrapperComponent = props.isMobileLayout ? MobileWrapper : Wrapper;

    const gotoWithReport = (routeName: typeof BOTTOM_MENU_ITEMS[number]['route']) => {
        if (routeName === 'notifications-index') {
            analytics.report({ type: 'menu/goto/notifications-index' });
        } else if (routeName === 'settings-index') {
            analytics.report({ type: 'menu/goto/settings-index' });
        }
        goto(routeName);
    };

    return (
        <WrapperComponent>
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
                label={<Translation id="TR_DISCREET" />}
                icon={discreetMode ? 'HIDE' : 'SHOW'}
                isMobileLayout={props.isMobileLayout}
            />

            {BOTTOM_MENU_ITEMS.map(item => {
                const { route, icon } = item;
                const dataTestId = `@suite/menu/${route}`;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === activeApp : false;
                const unseenNotifications = notifications.some(n => !n.seen);

                return (
                    <ActionItem
                        label={<Translation id={item.translationId} />}
                        data-test={dataTestId}
                        onClick={() => {
                            gotoWithReport(route);
                            if (props.closeMainNavigation) props.closeMainNavigation();
                        }}
                        isActive={isActive}
                        icon={icon}
                        withAlertDot={
                            !isActive && route === 'notifications-index' && unseenNotifications
                        }
                        isMobileLayout={props.isMobileLayout}
                    />
                );
            })}
        </WrapperComponent>
    );
};

export default NavigationActions;
