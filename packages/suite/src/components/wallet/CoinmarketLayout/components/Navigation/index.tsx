import React from 'react';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { variables } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import { Translation } from '@suite-components';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    min-height: 57px;
    padding: 0 25px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }

    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props => (props.active ? props.theme.TYPE_GREEN : props.theme.TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 14px 6px 12px 6px;
    white-space: nowrap;
    border-bottom: 2px solid ${props => (props.active ? props.theme.BG_GREEN : 'transparent')};

    & + & {
        margin-left: 42px;
    }
`;

const Text = styled.div`
    position: relative;
`;

const Soon = styled.div`
    position: absolute;
    top: -10px;
    right: -15px;
    background: ${props => props.theme.BG_WHITE};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
    padding: 2px 4px;
    color: ${props => props.theme.TYPE_GREEN};
    border-radius: 4px;
    font-size: 9px;
`;

const Navigation = () => {
    const items = [
        { route: 'wallet-coinmarket-buy', title: <Translation id="TR_NAV_BUY" />, soon: false },
        { route: 'wallet-coinmarket-sell', title: <Translation id="TR_NAV_SELL" />, soon: false },
        {
            route: 'wallet-coinmarket-exchange',
            title: <Translation id="TR_NAV_EXCHANGE" />,
            soon: false,
        },
        { route: 'wallet-coinmarket-spend', title: <Translation id="TR_NAV_SPEND" />, soon: false },
    ] as const;

    const routeName = useSelector(state => state.router.route?.name);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            {items.map(item => {
                const { route, title, soon } = item;
                const active = routeName === route;
                return (
                    <StyledNavLink
                        key={route}
                        active={active}
                        onClick={() => {
                            if (soon) {
                                return () => {};
                            }
                            goto(route, undefined, true);
                        }}
                    >
                        <Text>
                            {soon && (
                                <Soon>
                                    <Translation id="TR_NAV_SOON" />
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

export default Navigation;
