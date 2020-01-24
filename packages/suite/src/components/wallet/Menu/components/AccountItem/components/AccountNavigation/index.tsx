import React, { useState } from 'react';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components-v2';
import { ITEMS, HIDDEN_ITEMS } from '@wallet-config/menu';
import { Props } from './Container';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    cursor: pointer;
    flex-direction: column;
    padding: 0px 10px 10px 10px;
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => (props.active ? colors.BLACK17 : colors.BLACK50)};
    font-weight: ${props => (props.active ? 500 : FONT_WEIGHT.REGULAR)};
    display: flex;
    align-items: center;
    margin-bottom: 12px;

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

const AccountNavigation = (props: Props) => {
    const [moreItemsActive, setMoreItemsActive] = useState(false);
    const { account } = props.selectedAccount;
    const { app, route } = props.router;
    if (app !== 'wallet' || !account) return null;

    return (
        <Wrapper>
            {ITEMS.map(item => {
                if (!item.isHidden()) {
                    return (
                        <StyledNavLink
                            key={item.route}
                            active={route ? route.name === item.route : false}
                            onClick={() => props.goto(item.route, undefined, true)}
                        >
                            <IconWrapper>
                                <Icon size={12} icon={item.icon} />
                            </IconWrapper>
                            <Text>{item.title}</Text>
                        </StyledNavLink>
                    );
                }
                return null;
            })}
            {/* {moreItemsActive &&
                HIDDEN_ITEMS.length > 0 &&
                HIDDEN_ITEMS.map(item => {
                    if (!item.isHidden(account.symbol)) {
                        return (
                            <StyledNavLink
                                key={item.route}
                                active={route ? route.name === item.route : false}
                                onClick={() => props.goto(item.route, undefined, true)}
                            >
                                <IconWrapper>
                                    <Icon size={12} icon={item.icon} />
                                </IconWrapper>
                                <Text>{item.title}</Text>
                            </StyledNavLink>
                        );
                    }
                    return null;
                })} */}
            {HIDDEN_ITEMS.length > 0 && (
                <StyledNavLink onClick={() => setMoreItemsActive(!moreItemsActive)}>
                    <IconWrapper>
                        <Icon size={12} icon={moreItemsActive ? 'CROSS' : 'PLUS'} />
                    </IconWrapper>
                    <Text>Show {moreItemsActive ? 'less' : 'more'}</Text>
                </StyledNavLink>
            )}
        </Wrapper>
    );
};

export default AccountNavigation;
