import React, { useState } from 'react';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { ITEMS, VISIBLE_ITEMS_LIMIT } from '@wallet-config/menu';
import { Route } from '@suite-types';
import { Account } from '@wallet-types';
import AnimationWrapper from '../AnimationWrapper';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: 0px 8px 8px 8px;
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => (props.active ? colors.BLACK17 : colors.BLACK25)};
    background-color: ${props => (props.active ? '#e0e0e0' : 'transparent')};
    border-radius: 4px;
    font-weight: ${props => (props.active ? 500 : FONT_WEIGHT.REGULAR)};
    display: flex;
    align-items: center;
    padding: 8px;

    &:active,
    &:hover {
        color: ${colors.BLACK17};
    }

    &:first-child,
    &:last-child {
        margin-left: 0px;
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
    routeName?: Route['name'];
    onClick: (routeName: Route['name']) => void;
}

export default (props: Props) => {
    const { account, routeName, onClick } = props;
    const [expanded, setExpanded] = useState(false);

    // collect all items suitable for current networkType
    const items = ITEMS.filter(item => !item.isHidden(account)).map(item => {
        const active = routeName === item.route;
        return (
            <StyledNavLink
                data-test={`@wallet/menu/${item.route}`}
                key={item.route}
                active={active}
                onClick={() => onClick(item.route)}
            >
                <IconWrapper>
                    <Icon size={12} icon={item.icon} color={active ? colors.BLACK17 : undefined} />
                </IconWrapper>
                <Text>{item.title}</Text>
            </StyledNavLink>
        );
    });

    // set variables
    const gotHiddenItems = items.length > VISIBLE_ITEMS_LIMIT + 1;
    const visibleItems = gotHiddenItems ? items.slice(0, VISIBLE_ITEMS_LIMIT) : items;
    const hiddenItems = gotHiddenItems ? items.slice(VISIBLE_ITEMS_LIMIT) : [];
    const isHiddenItemSelected = !!hiddenItems.find(item => item.props.active);
    const isOpened = expanded || isHiddenItemSelected;
    const showMoreStyles = isHiddenItemSelected ? { opacity: 0.4, cursor: 'default' } : {};

    return (
        <Wrapper>
            {visibleItems}
            {gotHiddenItems && (
                <>
                    <StyledNavLink
                        style={showMoreStyles}
                        onClick={() => setExpanded(isHiddenItemSelected ? true : !expanded)}
                    >
                        <IconWrapper>
                            <Icon size={12} icon={isOpened ? 'CROSS' : 'PLUS'} />
                        </IconWrapper>
                        <Text>
                            <Translation id={isOpened ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                        </Text>
                    </StyledNavLink>
                    <AnimationWrapper opened={isOpened}>{hiddenItems}</AnimationWrapper>
                </>
            )}
        </Wrapper>
    );
};
