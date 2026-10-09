import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Card, IconCircle, type IconComponent, variables } from '@trezor/components';
import { typography } from '@trezor/theme';

const Container = styled.div`
    padding: 16px;
    background: ${({ theme }) => theme.surfaceFillRaised};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0 14px;
    }
`;

const Image = styled.div`
    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 1;
        grid-row: 1/3;
    }
`;

const Title = styled.h3`
    align-self: end;
    ${typography['body-md-strong']}
    margin: 16px 0 8px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 1;
        margin: 0;
    }
`;

const Description = styled.p`
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 2;
        padding-top: 4px;
    }
`;

export interface TileProps {
    description: ReactNode;
    iconName: IconComponent;
    title: ReactNode;
}

export const Tile = ({ description, iconName, title }: TileProps) => (
    <Card paddingType="none">
        <Container>
            <Image>
                <IconCircle icon={iconName} size={96} />
            </Image>
            <Title>{title}</Title>
            <Description>{description}</Description>
        </Container>
    </Card>
);
