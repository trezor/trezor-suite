import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Card, IconCircle, type IconName, variables } from '@trezor/components';
import { typography } from '@trezor/theme';

const containerGridStyle = css`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 14px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Container = styled(Card)`
    background: ${({ theme }) => theme.backgroundNeutralBoldInverted};
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

const Image = styled.div`
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
    ${typography['body-md-strong']}
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
    color: ${({ theme }) => theme.textSubdued};
    ${typography['body-sm']}

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
    iconName: IconName;
    title: ReactNode;
}

export const Tile = ({ description, iconName, title }: TileProps) => (
    <Container>
        <Image>
            <IconCircle name={iconName} size={96} />
        </Image>
        <Title>{title}</Title>
        <Description>{description}</Description>
    </Container>
);
