import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    border-radius: 6px;
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
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
}

const Card = ({ children, title, description, ...rest }: Props) => (
    <Wrapper>
        {title && (
            <Header>
                <Title>{title}</Title>
                {description && <Description>{description}</Description>}
            </Header>
        )}
        <Content {...rest}>{children}</Content>
    </Wrapper>
);
export default Card;
