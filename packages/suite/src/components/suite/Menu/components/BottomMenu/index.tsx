import React from 'react';
import { Props as ContainerProps } from '../../Container';
import styled, { css } from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { findRouteByName } from '@suite-utils/router';
import { Icon, colors, Switch, Tooltip, variables } from '@trezor/components';
import { BOTTOM_MENU_ITEMS, MENU_PADDING } from '@suite-constants/menu';
import Divider from '../Divider';
import NotificationsBadge from './NotificationsBadge';

const Wrapper = styled.div`
    padding: ${MENU_PADDING}px 0 10px 10px;
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
    flex: 1;
    align-items: center;
`;

const SubMenu = styled.div`
    display: flex;
    padding-right: 10px;
    align-items: center;
    color: ${colors.WHITE};
    justify-content: space-between;
`;

const SubMenuText = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

interface ComponentProps {
    isActive: boolean;
}

const Text = styled.div<ComponentProps>`
    color: ${colors.WHITE};
    font-size: 12px;
    padding-top: 2px;
    display: flex;
    align-items: center;

    ${props =>
        props.isActive &&
        css`
            color: ${colors.BLACK0};
        `}
`;

const In = styled.div<ComponentProps>`
    cursor: pointer;
    padding: 6px 0;
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    display: flex;
    flex: 1;
    flex-direction: flex-start;
    align-items: center;
    padding-left: 10px;

    ${props =>
        props.isActive &&
        css`
            background: ${colors.WHITE};
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
`;

interface Props {
    app: string;
    goto: ContainerProps['goto'];
    discreetMode: boolean;
    setDiscreetMode: (s: boolean) => void;
}

const BottomMenu = (props: Props) => (
    <Wrapper>
        {BOTTOM_MENU_ITEMS.map(item => {
            const { route, icon, text } = item;
            const dataTestId = `@suite/menu/${text.toLocaleLowerCase()}`;
            const routeObj = findRouteByName(route);
            const isActive = routeObj ? routeObj.app === props.app : false;

            const defaultIcon = (
                <Icon color={isActive ? colors.BLACK0 : colors.WHITE} size={14} icon={icon} />
            );

            const iconComponent =
                !isActive && route === 'notifications-index' ? (
                    <NotificationsBadge defaultIcon={defaultIcon} />
                ) : (
                    defaultIcon
                );

            return (
                <In
                    key={text}
                    data-test={dataTestId}
                    onClick={() => props.goto(routeObj!.name)}
                    isActive={isActive}
                >
                    <MenuItemWrapper>
                        <IconWrapper>{iconComponent}</IconWrapper>
                        <Text isActive={isActive}>{text}</Text>
                    </MenuItemWrapper>
                </In>
            );
        })}
        <StyledDivider className="divider" />
        <SubMenu>
            <SubMenuText>Discreet</SubMenuText>
            <SwitchWrapper>
                <Tooltip
                    placement="right"
                    offset={50}
                    content={<Translation id="TR_DISCREET_TOOLTIP" />}
                >
                    <Switch
                        isSmall
                        checked={props.discreetMode}
                        onChange={checked => {
                            props.setDiscreetMode(checked);
                        }}
                    />
                </Tooltip>
            </SwitchWrapper>
        </SubMenu>
    </Wrapper>
);

export default BottomMenu;
