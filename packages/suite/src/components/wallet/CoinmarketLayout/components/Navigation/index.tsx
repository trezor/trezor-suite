import React from 'react';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { colors, variables } from '@trezor/components';
import { useSelector, useActions } from '@suite/hooks/suite';
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

    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props => (props.active ? colors.NEUE_TYPE_GREEN : colors.NEUE_TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 14px 6px 12px 6px;
    white-space: nowrap;
    border-bottom: 2px solid ${props => (props.active ? colors.NEUE_BG_GREEN : 'transparent')};

    & + & {
        margin-left: 42px;
    }
`;

const Text = styled.div``;

const Navigation = () => {
    const items = [
        { route: 'wallet-coinmarket-buy', title: <Translation id="TR_NAV_BUY" /> },
        { route: 'wallet-coinmarket-exchange', title: <Translation id="TR_NAV_EXCHANGE" /> },
        { route: 'wallet-coinmarket-spend', title: <Translation id="TR_NAV_SPEND" /> },
    ] as const;

    const routeName = useSelector(state => state.router.route?.name);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            {items.map(item => {
                const { route, title } = item;
                const active = routeName === route;
                return (
                    <StyledNavLink
                        key={route}
                        active={active}
                        onClick={() => goto(route, undefined, true)}
                    >
                        <Text>{title}</Text>
                    </StyledNavLink>
                );
            })}
        </Wrapper>
    );
};

export default Navigation;
