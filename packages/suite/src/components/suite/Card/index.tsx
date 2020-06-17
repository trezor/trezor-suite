import React from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '@trezor/components';
import { CARD_PADDING_SIZE, CARD_PADDING_SIZE_LARGE } from '@suite-constants/layout';

const getPaddingSize = (
    largePadding?: boolean,
    noPadding?: boolean,
    noVerticalPadding?: boolean,
) => {
    if (noPadding) return '0px';
    if (noVerticalPadding) {
        if (largePadding) return `0px ${CARD_PADDING_SIZE_LARGE}`;
        return `0px ${CARD_PADDING_SIZE}`;
    }
    if (largePadding) return CARD_PADDING_SIZE_LARGE;
    return CARD_PADDING_SIZE;
};

const Wrapper = styled.div<{ isColumn?: boolean }>`
    display: flex;
    flex-direction: column;
    ${props =>
        props.isColumn &&
        css`
            flex: 1;
        `}
`;

const Content = styled.div<{ paddingSize: string }>`
    display: flex;
    border-radius: 6px;
    padding: ${props => props.paddingSize};
    background: ${colors.WHITE};
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
    padding: 12px;
    display: flex;
    flex-direction: column;
`;

const Title = styled.div`
    flex: 1;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const Description = styled.div``;

export interface Props {
    children?: React.ReactNode;
    customHeader?: React.ReactNode;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    largePadding?: boolean;
    noPadding?: boolean;
    noVerticalPadding?: boolean;
    isColumn?: boolean;
}

const Card = ({
    children,
    title,
    description,
    largePadding,
    noPadding,
    noVerticalPadding,
    customHeader,
    isColumn,
    ...rest
}: Props) => (
    <Wrapper isColumn={isColumn}>
        {title && (
            <Header>
                <Title>{title}</Title>
                {description && <Description>{description}</Description>}
            </Header>
        )}
        {customHeader}
        <Content paddingSize={getPaddingSize(largePadding, noPadding, noVerticalPadding)} {...rest}>
            {children}
        </Content>
    </Wrapper>
);
export default Card;
