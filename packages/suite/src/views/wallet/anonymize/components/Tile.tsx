import React from 'react';
import styled from 'styled-components';

import { Image, PngImage, variables } from '@trezor/components';

const Container = styled.div`
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: 8px;
    padding: 16px;
`;

const Title = styled.h3`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 16px 0 8px 0;
`;

const Description = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

export interface TileProps {
    description: React.ReactNode;
    image: PngImage;
    title: React.ReactNode;
}

export const Tile = ({ description, image, title }: TileProps) => (
    <Container>
        <Image image={image} height={72} />
        <Title>{title}</Title>
        <Description>{description}</Description>
    </Container>
);
