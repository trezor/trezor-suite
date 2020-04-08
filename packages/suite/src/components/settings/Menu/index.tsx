import { Translation } from '@suite-components/Translation';
import { SUPPORT_URL } from '@suite-constants/urls';
import { colors, Icon, Link, variables } from '@trezor/components';
import { IconType } from '@trezor/components/lib/support/types';
import React from 'react';
import styled, { css } from 'styled-components';

import { Props } from './Container';

const ContentWrapper = styled.div`
    padding: 0 10px;
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Bottom = styled.div`
    margin-top: auto;
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

export default ({ openModal }: Props) => {
    return (
        <ContentWrapper>
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
};
