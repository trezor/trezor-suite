import React from 'react';
import { findRouteByName } from '@suite-utils/router';
import styled, { css } from 'styled-components';
import { Icon, colors } from '@trezor/components-v2';
import { ITEMS } from '@suite-constants/menu';
import { Props as ContainerProps } from '../../Container';

const Wrapper = styled.div`
    background: ${colors.BLACK17};
    display: flex;
    margin-top: 5px;
`;

interface ComponentProps {
    isActive: boolean;
}

const In = styled.div<ComponentProps>`
    cursor: pointer;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    display: flex;
    flex: 1;
    margin-left: 10px;
    padding: 20px 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${props =>
        props.isActive &&
        css`
            background: ${colors.WHITE};
        `}
`;

const InnerWrapper = styled.div<ComponentProps>`
    color: ${colors.WHITE};
    font-weight: bold; /* TODO: fetch from components */

    ${props =>
        props.isActive &&
        css`
            color: ${colors.BLACK0};
        `}
`;

const IconWrapper = styled(InnerWrapper)<ComponentProps>`
    padding-bottom: 3px;
`;

const Text = styled(InnerWrapper)<ComponentProps>``;

interface Props {
    app: string;
    goTo: ContainerProps['goto'];
}

const Menu = (props: Props) => {
    return ITEMS.map(item => {
        const { route, icon, text } = item;
        const routeObj = findRouteByName(route);
        const isActive = item.route === `${props.app}-index`;

        if (!routeObj) return null;

        return (
            <Wrapper key={text}>
                <In onClick={() => props.goTo(routeObj.pattern)} isActive={isActive}>
                    <IconWrapper isActive={isActive}>
                        <Icon
                            size={20}
                            color={isActive ? colors.BLACK0 : colors.WHITE}
                            icon={icon}
                        ></Icon>
                    </IconWrapper>
                    <Text isActive={isActive}>{text}</Text>
                </In>
            </Wrapper>
        );
    });
};

export default Menu;
