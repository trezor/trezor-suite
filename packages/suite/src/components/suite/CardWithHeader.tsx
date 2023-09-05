import { ReactNode } from 'react';
import styled from 'styled-components';
import { variables, Card } from '@trezor/components';

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
    withLargePadding?: boolean;
    noPadding?: boolean;
}

// LEGACY COMPONENT – DO NOT USE, use Card from the component package instead
export const CardWithHeader = ({
    children,
    title,
    description,
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
        <Content {...rest}>{children}</Content>
    </Wrapper>
);
