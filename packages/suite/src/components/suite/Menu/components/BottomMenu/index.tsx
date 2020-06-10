import { Translation } from '@suite-components/Translation';
import { BOTTOM_MENU_ITEMS } from '@suite-constants/menu';
import { findRouteByName } from '@suite-utils/router';
import { colors, Icon, Switch, Tooltip, variables } from '@trezor/components';
import React from 'react';
import styled, { css } from 'styled-components';
import { useAnalytics } from '@suite-hooks';

import { Props as ContainerProps } from '../../Container';
import Divider from '../Divider';
import RoundedCorner from '../RoundedCorner';
import NotificationsBadge from './NotificationsBadge';

const Wrapper = styled.div`
    padding: 20px 0px 20px 6px;
`;

const MenuItemWrapper = styled.div`
    display: flex;
    color: ${colors.WHITE};
    cursor: pointer;
    align-items: center;
    justify-content: space-between;
`;

const IconWrapper = styled.div`
    padding-right: 5px;
    display: flex;
    align-items: center;
`;

const SubMenu = styled.div`
    display: flex;
    padding-right: 10px;
    padding-left: 6px;
    align-items: center;
    color: ${colors.WHITE};
`;

interface ComponentProps {
    isActive?: boolean;
}

const Text = styled.div<ComponentProps>`
    color: ${colors.WHITE};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 2px;
    display: flex;
    align-items: center;
    flex: 1;
    ${props =>
        props.isActive &&
        css`
            color: ${colors.BLACK0};
        `}
`;

const In = styled.div<ComponentProps>`
    cursor: pointer;
    padding: 6px 0px 6px 6px;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    display: flex;
    flex: 1;
    flex-direction: flex-start;
    align-items: center;
    ${props =>
        props.isActive &&
        css`
            background: ${colors.BACKGROUND};
        `}
    ${props =>
        !props.isActive &&
        css`
            &:hover {
                background-color: ${colors.BLACK25};
            }
        `}
`;

const StyledDivider = styled(Divider)`
    padding: 5px 10px 10px 0;
`;

const SwitchWrapper = styled.div`
    display: flex;
    .tippy-popper {
        padding-left: 8px;
    }
`;

interface Props {
    app: string;
    goto: ContainerProps['goto'];
    openSecondaryMenu?: () => void;
    discreetMode: boolean;
    setDiscreetMode: (s: boolean) => void;
}

const BottomMenu = (props: Props) => {
    const analytics = useAnalytics();
    const gotoWithReport = (routeName: typeof BOTTOM_MENU_ITEMS[number]['route']) => {
        if (routeName === 'notifications-index') {
            analytics.report({ type: 'menu/goto/notifications-index' });
        } else if (routeName === 'settings-index') {
            analytics.report({ type: 'menu/goto/settings-index' });
        }
        props.goto(routeName);
    };

    return (
        <Wrapper>
            {BOTTOM_MENU_ITEMS.map(item => {
                const { route, icon, translationId } = item;
                const dataTestId = `@suite/menu/${route}`;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === props.app : false;
                const callback = (isActive && props.openSecondaryMenu) || gotoWithReport;

                const defaultIcon = (
                    <Icon color={isActive ? colors.BLACK0 : colors.WHITE} size={16} icon={icon} />
                );

                const iconComponent =
                    !isActive && route === 'notifications-index' ? (
                        <NotificationsBadge defaultIcon={defaultIcon} />
                    ) : (
                        defaultIcon
                    );

                return (
                    <React.Fragment key={route}>
                        <RoundedCorner top isActive={isActive} />
                        <In
                            key={translationId}
                            data-test={dataTestId}
                            onClick={() => callback(route)}
                            isActive={isActive}
                        >
                            <MenuItemWrapper>
                                <IconWrapper>{iconComponent}</IconWrapper>
                                <Text isActive={isActive}>
                                    <Translation id={translationId} />
                                </Text>
                            </MenuItemWrapper>
                        </In>
                        <RoundedCorner bottom isActive={isActive} />
                    </React.Fragment>
                );
            })}
            <StyledDivider className="divider" />
            <SubMenu>
                <IconWrapper>
                    <Icon
                        color={colors.WHITE}
                        size={16}
                        icon={props.discreetMode ? 'HIDE' : 'SHOW'}
                    />
                </IconWrapper>
                <Text>
                    <Translation id="TR_DISCREET" />
                </Text>

                <SwitchWrapper>
                    <Tooltip placement="right" content={<Translation id="TR_DISCREET_TOOLTIP" />}>
                        <Switch
                            isSmall
                            checked={props.discreetMode}
                            onChange={checked => {
                                analytics.report({
                                    type: 'menu/toggle-discreet',
                                    payload: {
                                        value: checked,
                                    },
                                });
                                props.setDiscreetMode(checked);
                            }}
                        />
                    </Tooltip>
                </SwitchWrapper>
            </SubMenu>
        </Wrapper>
    );
};

export default BottomMenu;
