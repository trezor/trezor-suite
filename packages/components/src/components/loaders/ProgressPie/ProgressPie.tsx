import { ReactNode } from 'react';

import styled from 'styled-components';

import { Elevation, mapElevationToBorder } from '@trezor/theme';

import { useElevation } from '../../ElevationContext/ElevationContext';

const Container = styled.div<{
    $valueInPercents: number;
    $size: number;
    $color?: string;
    $backgroundColor?: string;
    $elevation: Elevation;
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${({ $size }) => `${$size}px`};
    height: ${({ $size }) => `${$size}px`};
    border-radius: 50%;
    background: ${({ theme, $valueInPercents, $color, $backgroundColor, $elevation }) =>
        `conic-gradient(${$color || theme.backgroundPrimaryDefault} ${3.6 * $valueInPercents}deg, ${
            $backgroundColor || mapElevationToBorder({ $elevation, theme })
        } 0)`};
`;

export interface ProgressPieProps {
    valueInPercents: number; // 0-100
    size?: number;
    color?: string;
    backgroundColor?: string;
    children?: ReactNode;
    className?: string;
}

export const ProgressPie = ({
    size = 16,
    children,
    valueInPercents,
    backgroundColor,
    className,
    color,
}: ProgressPieProps) => {
    const { elevation } = useElevation();

    return (
        <Container
            $size={size}
            $valueInPercents={valueInPercents}
            $backgroundColor={backgroundColor}
            $color={color}
            className={className}
            $elevation={elevation}
        >
            {children}
        </Container>
    );
};
