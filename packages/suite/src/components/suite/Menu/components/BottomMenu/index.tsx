import React from 'react';
import { Props as ContainerProps } from '../../Container';
import styled, { css } from 'styled-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { findRouteByName } from '@suite-utils/router';
import { Icon, colors, Switch, Tooltip } from '@trezor/components';
import { BOTTOM_MENU_ITEMS, MENU_PADDING } from '@suite-constants/menu';
import Divider from '../Divider';

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
    margin-left: 20px;
    flex: 1;
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
                <In
                    key={text}
                    data-test={dataTestId}
                    onClick={() => props.goto(routeObj!.name)}
                    isActive={isActive}
                >
                    <MenuItemWrapper>
                        <IconWrapper>
                            <Icon
                                color={isActive ? colors.BLACK0 : colors.WHITE}
                                size={12}
                                icon={icon}
                            />
                        </IconWrapper>
                        <Text isActive={isActive}>{text}</Text>
                    </MenuItemWrapper>
                </In>
            );
        })}
        <StyledDivider className="divider" />
        <SubMenu>
            <MenuItemWrapper>
                <SubMenuText>Discreet</SubMenuText>
                <SwitchWrapper>
                    <Tooltip
                        placement="right"
                        content={<Translation {...messages.TR_DISCREET_TOOLTIP} />}
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
            </MenuItemWrapper>
        </SubMenu>
    </Wrapper>
);

export default BottomMenu;
