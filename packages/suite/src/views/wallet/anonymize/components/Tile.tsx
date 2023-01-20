import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';

const Container = styled.div`
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: 8px;
    padding: 16px;
`;

const Title = styled.h3`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 8px;
`;

const Description = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

interface TileProps {
    children: React.ReactElement;
    description: React.ReactNode;
    title: React.ReactNode;
}

export const Tile = ({ children, description, title }: TileProps) => (
    <Container>
        {children}
        <Title>{title}</Title>
        <Description>{description}</Description>
    </Container>
);
