import React from 'react';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { colors, variables } from '@trezor/components';
import { Route } from '@suite-types';
import { useSelector, useActions } from '@suite/hooks/suite';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
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

const Text = styled.div`
    padding-left: 8px;
`;

interface Props {
    items: {
        route: Route['name'];
        title: JSX.Element;
        'data-test'?: string;
    }[];
}

const Navigation = ({ items }: Props) => {
    const routeName = useSelector(state => state.router.route?.name);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper>
            {items.map(item => {
                const { route, title, ...restItemProps } = item;
                const active = routeName === route;
                return (
                    <StyledNavLink
                        key={route}
                        active={active}
                        onClick={() => goto(route, undefined, true)}
                        {...restItemProps}
                    >
                        <Text>{title}</Text>
                    </StyledNavLink>
                );
            })}
        </Wrapper>
    );
};

export default Navigation;
