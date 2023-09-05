import { ReactNode } from 'react';
import styled from 'styled-components';
import { variables, Card } from '@trezor/components';
import { CARD_PADDING_SIZE, CARD_PADDING_SIZE_LARGE } from 'src/constants/suite/layout';

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

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled(Card)`
    flex-direction: row;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Description = styled.div``;

export interface CardWithHeaderProps {
    children?: ReactNode;
    customHeader?: ReactNode;
    title?: string | ReactNode;
    description?: string | ReactNode;
    largePadding?: boolean;
    noPadding?: boolean;
    noVerticalPadding?: boolean;
}

export const CardWithHeader = ({
    children,
    title,
    description,
    largePadding,
    noPadding,
    noVerticalPadding,
    customHeader,
    ...rest
}: CardWithHeaderProps) => (
    <Wrapper>
        {title && (
            <Header>
                <Title>{title}</Title>
                {description && <Description>{description}</Description>}
            </Header>
        )}
        {customHeader}
        <Content
            customPadding={getPaddingSize(largePadding, noPadding, noVerticalPadding)}
            {...rest}
        >
            {children}
        </Content>
    </Wrapper>
);
