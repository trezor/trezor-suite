import React from 'react';
import { findRouteByName } from '@suite-utils/router';
import styled from 'styled-components';
import { Switch } from '@trezor/components';
import { Icon, colors } from '@trezor/components-v2';
import { BOTTOM_MENU_ITEMS, MENU_PADDING } from '@suite-constants/menu';
import Divider from '../Divider';

const Wrapper = styled.div`
    padding: ${MENU_PADDING}px 10px;
`;

const MenuItemWrapper = styled.div`
    display: flex;
    font-weight: bold;
    padding-bottom: 10px;
    color: ${colors.WHITE};
`;

const IconWrapper = styled.div``;

const Text = styled.div`
    padding-left: 10px;
`;

const SubMenu = styled.div`
    margin-top: 10px;
`;

const SubMenuText = styled.div`
    display: flex;
    flex: 1;
`;

const BottomMenu = () => (
    <Wrapper>
        {BOTTOM_MENU_ITEMS.map(item => {
            const { route, icon, text } = item;
            const routeObj = findRouteByName(route);

            if (!routeObj) return null;

            return (
                <MenuItemWrapper key={text}>
                    <IconWrapper>
                        <Icon color={colors.WHITE} size={10} icon={icon} />
                    </IconWrapper>
                    <Text>{text}</Text>
                </MenuItemWrapper>
            );
        })}
        <Divider />
        <SubMenu>
            <MenuItemWrapper>
                <SubMenuText>Discreet</SubMenuText>
                <Switch
                    isSmall
                    checked={false}
                    onChange={() => {
                        console.log('change me');
                    }}
                />
            </MenuItemWrapper>
        </SubMenu>
    </Wrapper>
);

export default BottomMenu;
