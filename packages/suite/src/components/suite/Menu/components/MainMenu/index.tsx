import React from 'react';
import { findRouteByName } from '@suite-utils/router';
import styled, { css } from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { MAIN_MENU_ITEMS } from '@suite-constants/menu';
import { Props as ContainerProps } from '../../Container';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const MenuItemWrapper = styled.div`
    background: ${colors.BLACK17};
    font-size: ${variables.FONT_SIZE.SMALL};
    display: flex;
    flex-direction: column;
`;

interface ComponentProps {
    isActive: boolean;
    isDisabled?: boolean;
}

const In = styled.div<ComponentProps>`
    cursor: ${props => (!props.isDisabled ? 'pointer' : 'initial')};
    opacity: ${props => (!props.isDisabled ? 1 : 0.4)};
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    display: flex;
    flex: 1;
    margin-left: 6px;
    padding: 20px 10px 20px 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${props =>
        props.isActive &&
        css`
            padding: 20px 0 20px 0;
            background: ${colors.BACKGROUND};
        `}

    ${props =>
        !props.isDisabled &&
        !props.isActive &&
        css`
            &:hover {
                background-color: ${colors.BLACK25};
            }
        `}
`;

const InnerWrapper = styled.div<ComponentProps>`
    color: ${colors.WHITE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

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

const ComingSoon = styled.div`
    font-size: 9px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.WHITE};
`;

const CornerWrapper = styled.div`
    width: 100%;
    height: 8px;
    display: flex;
    justify-content: flex-end;
`;

const CornerBg = styled.div`
    position: absolute;
    height: 8px;
    width: 8px;
    background: ${colors.BACKGROUND};
`;

const Corner = styled.div`
    height: 8px;
    position: relative;
    width: 8px;
    background: ${colors.BLACK17};
`;

const CornerTop = styled(Corner)`
    border-bottom-right-radius: 6px;
`;

const CornerBottom = styled(Corner)`
    border-top-right-radius: 6px;
`;

interface Props {
    app: string;
    goto: ContainerProps['goto'];
    openSecondaryMenu?: () => void;
}

const Menu = (props: Props) => (
    <Wrapper>
        {MAIN_MENU_ITEMS.map(item => {
            const { route, icon, translationId, isDisabled } = item;
            const routeObj = findRouteByName(route);
            const isActive = routeObj ? routeObj.app === props.app : false;
            const callback = (isActive && props.openSecondaryMenu) || props.goto;
            return (
                <MenuItemWrapper key={route}>
                    {isActive && (
                        <CornerWrapper>
                            <CornerBg />
                            <CornerTop />
                        </CornerWrapper>
                    )}
                    <In
                        data-test={`@suite/menu/${route}`}
                        onClick={() => !isDisabled && callback(routeObj!.name)}
                        isActive={isActive}
                        isDisabled={isDisabled}
                    >
                        <IconWrapper isActive={isActive}>
                            <Icon
                                size={20}
                                color={isActive ? colors.BLACK0 : colors.WHITE}
                                icon={icon}
                            />
                        </IconWrapper>
                        <Text isActive={isActive}>
                            <Translation id={translationId} />
                        </Text>
                        {isDisabled && (
                            <ComingSoon>
                                <Translation id="TR_COMING_SOON" />
                            </ComingSoon>
                        )}
                    </In>
                    {isActive && (
                        <CornerWrapper>
                            <CornerBg />
                            <CornerBottom />
                        </CornerWrapper>
                    )}
                </MenuItemWrapper>
            );
        })}
    </Wrapper>
);

export default Menu;
