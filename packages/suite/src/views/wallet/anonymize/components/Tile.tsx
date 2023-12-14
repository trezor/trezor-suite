import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { Card, Image, PngImage, variables } from '@trezor/components';

const containerGridStyle = css`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 14px;
`;

const Container = styled(Card)`
    background: ${({ theme }) => theme.BG_GREY};
    box-shadow: none;
    display: block;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${containerGridStyle}
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        ${containerGridStyle}
    }
`;

const imageGridStyle = css`
    width: 60px;
    height: 60px;
    grid-column: 1;
    grid-row: 1/3;
`;

const StyledImage = styled(Image)`
    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${imageGridStyle}
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        width: 72px;
        height: 72px;
        grid-column: unset;
        grid-row: unset;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        ${imageGridStyle}
    }
`;

const titleGridStyle = css`
    grid-column: 2;
    grid-row: 1;
    margin: 0;
`;

const Title = styled.h3`
    align-self: end;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 16px 0 8px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${titleGridStyle}
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-column: unset;
        grid-row: unset;
        margin: 16px 0 8px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        ${titleGridStyle}
    }
`;

const descriptionGridStyle = css`
    grid-column: 2;
    grid-row: 2;
    padding-top: 4px;
`;

const Description = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${descriptionGridStyle}
    }

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-column: unset;
        grid-row: unset;
        padding-top: 0;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        ${descriptionGridStyle}
    }
`;

export interface TileProps {
    description: ReactNode;
    image: PngImage;
    title: ReactNode;
}

export const Tile = ({ description, image, title }: TileProps) => (
    <Container>
        <StyledImage image={image} height={72} />
        <Title>{title}</Title>
        <Description>{description}</Description>
    </Container>
);
