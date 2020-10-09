import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables, IconProps } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { Route } from '@suite-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }
`;

const StyledNavLink = styled.div<{ isComingSoon?: boolean; active?: boolean }>`
    cursor: ${props => (props.isComingSoon ? 'default' : 'pointer')};
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props => (props.active ? colors.NEUE_TYPE_GREEN : colors.NEUE_TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 14px 8px 12px 6px;
    white-space: nowrap;
    border-bottom: 2px solid ${props => (props.active ? colors.NEUE_BG_GREEN : 'transparent')};

    & + & {
        margin-left: 42px;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    justify-content: center;
    width: 16px;
`;

const Text = styled.div`
    padding-left: 8px;
    position: relative;
`;

const Soon = styled.div`
    position: absolute;
    top: -10px;
    right: -15px;
    background: #e1f2dc;
    font-weight: ${variables.FONT_WEIGHT.BOLD};
    padding: 2px 4px;
    color: ${colors.NEUE_TYPE_GREEN};
    border-radius: 4px;
    font-size: 9px;
`;

interface Props {
    items: {
        route: Route['name'];
        title: JSX.Element;
        icon: IconProps['icon'];
        isComingSoon?: boolean;
        'data-test'?: string;
    }[];
}

const AppNavigation = ({ items }: Props) => {
    const routeName = useSelector(state => state.router.route?.name);
    const { params } = useSelector(state => state.wallet.selectedAccount);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            {items.map(item => {
                const { route, title, icon, isComingSoon, ...restItemProps } = item;
                const active = routeName === route;
                return (
                    <StyledNavLink
                        key={route}
                        active={active}
                        isComingSoon={isComingSoon}
                        onClick={isComingSoon ? undefined : () => goto(route, params, !params)}
                        {...restItemProps}
                    >
                        <IconWrapper>
                            <Icon
                                size={18}
                                icon={icon}
                                color={active ? colors.NEUE_TYPE_GREEN : undefined}
                            />
                        </IconWrapper>

                        <Text>
                            {isComingSoon && (
                                <Soon>
                                    <Translation id="TR_NAV_EXCHANGE_SOON" />
                                </Soon>
                            )}
                            {title}
                        </Text>
                    </StyledNavLink>
                );
            })}
        </Wrapper>
    );
};

export default AppNavigation;
