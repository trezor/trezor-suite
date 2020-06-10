import React from 'react';
import { findRouteByName } from '@suite-utils/router';
import styled, { css } from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';
import RoundedCorner from '../RoundedCorner';
import { Translation } from '@suite-components';
import { MAIN_MENU_ITEMS } from '@suite-constants/menu';
import { Props as ContainerProps } from '../../Container';
import { useAnalytics } from '@suite-hooks';

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
    padding: 20px 0 20px 0;
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

interface Props {
    app: string;
    goto: ContainerProps['goto'];
    openSecondaryMenu?: () => void;
}

const Menu = (props: Props) => {
    const analytics = useAnalytics();

    const gotoWithReport = (routeName: typeof MAIN_MENU_ITEMS[number]['route']) => {
        switch (routeName) {
            case 'suite-index':
                analytics.report({ type: 'menu/goto/suite-index' });
                break;
            case 'exchange-index':
                analytics.report({ type: 'menu/goto/exchange-index' });
                break;
            case 'wallet-index':
                analytics.report({ type: 'menu/goto/wallet-index' });
                break;
            default:
            // no default
        }
        props.goto(routeName);
    };

    return (
        <Wrapper>
            {MAIN_MENU_ITEMS.map(item => {
                const { route, icon, translationId, isDisabled } = item;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === props.app : false;
                const callback = (isActive && props.openSecondaryMenu) || gotoWithReport;
                return (
                    <MenuItemWrapper key={route}>
                        <RoundedCorner top isActive={isActive} />
                        <In
                            data-test={`@suite/menu/${route}`}
                            onClick={() => !isDisabled && callback(route)}
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
                        <RoundedCorner bottom isActive={isActive} />
                    </MenuItemWrapper>
                );
            })}
        </Wrapper>
    );
};

export default Menu;
