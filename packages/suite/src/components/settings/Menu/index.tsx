import { Translation } from '@suite-components/Translation';
import { SUPPORT_URL } from '@suite-constants/urls';
import { colors, H2, Icon, Link, variables } from '@trezor/components';
import React from 'react';
import styled, { css } from 'styled-components';
import { IconType } from '@trezor/components/lib/support/types';
import { Props } from './Container';

const ContentWrapper = styled.div`
    padding: 0 10px;
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Bottom = styled.div`
    margin-top: auto;
`;

const Heading = styled(H2)`
    padding-left: 10px;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
`;

const Items = styled.div``;

const ItemWrapper = styled.div<{ isActive?: boolean }>`
    width: 100%;
    height: 50px;
    border-radius: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    cursor: pointer;
    color: ${({ isActive }) => (isActive ? colors.BLACK0 : colors.BLACK25)};
    /* todo: not in variables */
    font-weight: ${({ isActive }) => (isActive ? 500 : variables.FONT_WEIGHT.REGULAR)};
    display: flex;
    align-items: center;

    ${({ isActive }) =>
        isActive &&
        css`
            background-color: ${colors.BLACK96};
        `}
`;

const StyledIcon = styled(Icon)`
    padding-left: 10px;
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
        <StyledIcon color={isActive ? colors.BLACK0 : colors.BLACK25} icon={icon} size={18} />
        {label}
    </ItemWrapper>
);

const ITEMS = [
    {
        label: <Translation id="TR_GENERAL" />,
        'data-test': '@settings/menu/general',
        icon: 'SETTINGS',
        route: 'settings-index',
    },
    {
        label: <Translation id="TR_DEVICE" />,
        'data-test': '@settings/menu/device',
        icon: 'TREZOR',
        route: 'settings-device',
    },
    {
        label: <Translation id="TR_COINS" />,
        'data-test': '@settings/menu/wallet',
        icon: 'COINS',
        route: 'settings-wallet',
    },
] as const;

export default ({ goto, router, openModal }: Props) => (
    <ContentWrapper>
        <Heading>
            <Translation id="TR_SETTINGS" />
        </Heading>
        <Items>
            {ITEMS.map(i => (
                <Item
                    key={i.route}
                    {...i}
                    onClick={() => goto(i.route)}
                    isActive={
                        router &&
                        typeof router.route !== 'undefined' &&
                        i.route === router.route.name
                    }
                />
            ))}
        </Items>
        <Bottom>
            <Items>
                <Item
                    data-test="@settings/menu/support"
                    icon="SUPPORT"
                    label={
                        <Link variant="nostyle" href={SUPPORT_URL}>
                            <Translation id="TR_SUPPORT" />
                        </Link>
                    }
                />
                <Item
                    data-test="@settings/menu/log"
                    icon="LOG"
                    onClick={() => openModal({ type: 'log' })}
                    label={<Translation id="TR_SHOW_LOG" />}
                />
            </Items>
        </Bottom>
    </ContentWrapper>
);
