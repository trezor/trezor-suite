import React from 'react';
import { findRouteByName } from '@suite-utils/router';
import styled, { css } from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { MAIN_MENU_ITEMS } from '@suite-constants/menu';
import { useAnalytics, useActions, useSelector } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

interface ComponentProps {
    isActive: boolean;
    isDisabled?: boolean;
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
`;

const MobileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0px 16px;
    flex: 1;

    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const MenuItem = styled.div<ComponentProps>`
    display: flex;
    cursor: ${props => (!props.isDisabled ? 'pointer' : 'auto')};
    /* font-size: ${props => (props.isActive ? '20px' : '16px')}; */
    font-size: 16px;

    ${props =>
        props.isActive &&
        css`
            /* same as font-size: 20px */
            transform: scale(1.25);
        `}

    & + & {
        margin-left: 32px;
    }
`;

const MobileMenuItem = styled.div<ComponentProps>`
    display: flex;
    padding: 20px 24px;
    cursor: ${props => (!props.isDisabled ? 'pointer' : 'auto')};
    font-size: ${props => (props.isActive ? '20px' : '16px')};

    ${props =>
        props.isActive &&
        css`
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
        `}

    & + & {
        border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    }
`;

const ItemTitleWrapper = styled.span`
    position: relative;
`;

const ItemTitle = styled.span<ComponentProps>`
    color: ${colors.BLACK50};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${props =>
        props.isActive &&
        css`
            color: ${colors.BLACK25};
        `}
`;

const NewBadge = styled.span`
    position: absolute;
    top: -12px;
    right: -12px;
    padding: 3px;
    background: ${colors.NEUE_BG_LIGHT_GREEN};
    color: ${colors.NEUE_TYPE_GREEN};
    letter-spacing: 0.2px;
    text-transform: UPPERCASE;
    font-size: 12px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    border-radius: 4px;
`;

interface Props {
    openSecondaryMenu?: () => void;
    closeMainNavigation?: () => void;
    isMobileLayout?: boolean;
}

const MainNavigation = (props: Props) => {
    const analytics = useAnalytics();
    const activeApp = useSelector(state => state.router.app);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

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
        goto(routeName);
    };

    const WrapperComponent = props.isMobileLayout ? MobileWrapper : Wrapper;
    const MenuItemComponent = props.isMobileLayout ? MobileMenuItem : MenuItem;

    return (
        <WrapperComponent>
            {MAIN_MENU_ITEMS.map(item => {
                const { route, translationId, isDisabled } = item;
                const routeObj = findRouteByName(route);
                const isActive = routeObj ? routeObj.app === activeApp : false;
                return (
                    <MenuItemComponent
                        key={route}
                        data-test={`@suite/menu/${route}`}
                        onClick={() => {
                            if (!isDisabled) {
                                gotoWithReport(route);
                                if (props.closeMainNavigation) {
                                    props.closeMainNavigation();
                                }
                            }
                        }}
                        isActive={isActive}
                        isDisabled={isDisabled}
                    >
                        <ItemTitleWrapper>
                            <ItemTitle isActive={isActive} isDisabled={isDisabled}>
                                <Translation id={translationId} />
                            </ItemTitle>
                            {isDisabled && <NewBadge>soon</NewBadge>}
                        </ItemTitleWrapper>
                    </MenuItemComponent>
                );
            })}
        </WrapperComponent>
    );
};

export default MainNavigation;
