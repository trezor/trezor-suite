import React from 'react';
import styled, { css } from 'styled-components';

import { Icon, colors, variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { IconType } from '@trezor/components/lib/support/types';
import { Translation } from '@suite-components/Translation';

import { useExchange } from '@exchange-hooks';
import { useActions } from '@suite-hooks';

const LEFT_PADDING = '10px';
const TEXT_COLOR = colors.BLACK25;
const ACTIVE_TEXT_COLOR = colors.BLACK0;
const SECONDARY_COLOR = colors.BLACK96;

const ContentWrapper = styled.div`
    padding: 10px ${LEFT_PADDING};
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Items = styled.div``;

const ItemWrapper = styled.div<{ isActive?: boolean }>`
    width: 100%;
    height: 50px;
    border-radius: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    cursor: pointer;
    color: ${({ isActive }) => (isActive ? ACTIVE_TEXT_COLOR : TEXT_COLOR)};
    /* todo: not in variables */
    font-weight: ${({ isActive }) => (isActive ? 500 : variables.FONT_WEIGHT.REGULAR)};
    display: flex;
    align-items: center;

    ${({ isActive }) =>
        isActive &&
        css`
            background-color: ${SECONDARY_COLOR};
        `}
`;

const StyledIcon = styled(Icon)`
    padding-left: ${LEFT_PADDING};
    padding-right: 10px;
    margin-bottom: 2px;
`;

interface ItemProps {
    label: React.ReactNode;
    icon: IconType;
    onClick?: () => void;
    isActive?: boolean;
    ['data-test']: string;
}

const Item = ({ label, icon, onClick, isActive, ...props }: ItemProps) => (
    <ItemWrapper onClick={onClick} data-test={props['data-test']} isActive={isActive}>
        <StyledIcon color={isActive ? ACTIVE_TEXT_COLOR : TEXT_COLOR} icon={icon} size={18} />
        {label}
    </ItemWrapper>
);

const ITEMS = [
    {
        label: <Translation id="TR_EXCHANGE" />,
        'data-test': '@exchange/menu/general',
        icon: 'PLUS',
        route: 'exchange-index',
    },
    {
        label: <Translation id="TR_BUY" />,
        'data-test': '@settings/menu/device',
        icon: 'PLUS',
        route: 'exchange-buy',
    },
    {
        label: <Translation id="TR_SELL" />,
        'data-test': '@settings/menu/wallet',
        icon: 'PLUS',
        route: 'exchange-sell',
    },
] as const;

const ExchangeMenu = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { router } = useExchange();
    return (
        <ContentWrapper>
            <Items>
                {ITEMS.map(i => (
                    <Item
                        key={i.route}
                        {...i}
                        onClick={() => goto(i.route)}
                        isActive={router.route && i.route === router.route.name}
                    />
                ))}
            </Items>
        </ContentWrapper>
    );
};

export default ExchangeMenu;
