import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { Icon, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { ITEMS, VISIBLE_ITEMS_LIMIT } from '@wallet-config/menu';
import { Route } from '@suite-types';
import { Account } from '@wallet-types';
import { useSelector, useActions } from '@suite/hooks/suite';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-top: 20px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props => (props.active ? colors.NEUE_TYPE_GREEN : colors.NEUE_TYPE_LIGHT_GREY)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding-top: 14px;
    padding-bottom: 12px;
    padding-right: 2px;
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
`;

interface Props {
    account: Account;
}

export default (props: Props) => {
    const routeName = useSelector(state => state.router.route?.name);
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { account } = props;
    const [expanded, setExpanded] = useState(false);

    // collect all items suitable for current networkType
    const items = ITEMS.filter(item => !item.isHidden(account)).map(item => {
        const active = routeName === item.route;
        return (
            <StyledNavLink
                data-test={`@wallet/menu/${item.route}`}
                key={item.route}
                active={active}
                onClick={() => goto(item.route, undefined, true)}
            >
                <IconWrapper>
                    <Icon
                        size={18}
                        icon={item.icon}
                        color={active ? colors.NEUE_TYPE_GREEN : undefined}
                    />
                </IconWrapper>
                <Text>{item.title}</Text>
            </StyledNavLink>
        );
    });

    const gotHiddenItems = items.length > VISIBLE_ITEMS_LIMIT + 1;
    const visibleItems = gotHiddenItems ? items.slice(0, VISIBLE_ITEMS_LIMIT) : items;
    const hiddenItems = gotHiddenItems ? items.slice(VISIBLE_ITEMS_LIMIT) : [];
    const isHiddenItemSelected = !!hiddenItems.find(item => item.props.active);
    const isOpened = expanded || isHiddenItemSelected;
    const showMoreStyles = isHiddenItemSelected ? { opacity: 0.4, cursor: 'default' } : {};

    // TODO: Do we still need hidden items?
    return <Wrapper>{visibleItems}</Wrapper>;
};
