import React from 'react';
import { Props as ContainerProps } from '../../Container';
import styled, { css } from 'styled-components';
import { findRouteByName } from '@suite-utils/router';
import { Icon, colors, Switch } from '@trezor/components-v2';
import { BOTTOM_MENU_ITEMS, MENU_PADDING } from '@suite-constants/menu';
import Divider from '../Divider';

const Wrapper = styled.div`
    padding: ${MENU_PADDING}px 0 10px 10px;
`;

const MenuItemWrapper = styled.div`
    display: flex;
    font-weight: bold;
    color: ${colors.WHITE};
    cursor: pointer;
`;

const IconWrapper = styled.div`
    padding-right: 5px;
`;

const SubMenu = styled.div`
    padding: 0 10px 0 0;
`;

const SubMenuText = styled.div`
    display: flex;
    flex: 1;
`;

interface ComponentProps {
    isActive: boolean;
}

const Text = styled.div<ComponentProps>`
    color: ${colors.WHITE};
    font-weight: bold;

    ${props =>
        props.isActive &&
        css`
            color: ${colors.BLACK0};
        `}
`;

const In = styled.div<ComponentProps>`
    cursor: pointer;
    padding: 10px 0;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
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
    padding: 5px 0 10px 0;
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

            return (
                <In key={text} onClick={() => props.goto(routeObj!.name)} isActive={isActive}>
                    <MenuItemWrapper data-test={dataTestId} onClick={() => props.goto(route)}>
                        <IconWrapper>
                            <Icon
                                color={isActive ? colors.BLACK0 : colors.WHITE}
                                size={10}
                                icon={icon}
                            />
                        </IconWrapper>
                        <Text isActive={isActive}>{text}</Text>
                    </MenuItemWrapper>
                </In>
            );
        })}
        <SubMenu>
            <StyledDivider className="divider" />
            <MenuItemWrapper>
                <SubMenuText>Discrete</SubMenuText>
                <Switch
                    isSmall
                    checked={props.discreetMode}
                    onChange={checked => {
                        props.setDiscreetMode(checked);
                    }}
                />
            </MenuItemWrapper>
        </SubMenu>
    </Wrapper>
);

export default BottomMenu;
