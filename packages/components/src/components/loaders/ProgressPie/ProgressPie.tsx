import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type Elevation, mapElevationToBorder } from '@trezor/theme';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import { useElevation } from '../../ElevationContext/ElevationContext';

export const allowedProgressPieFrameProps = ['margin'] as const satisfies FramePropsKeys[];

type AllowedFrameProps = Pick<FrameProps, (typeof allowedProgressPieFrameProps)[number]>;
type TransientAllowedFrameProps = TransientProps<AllowedFrameProps>;

const Container = styled.div<
    TransientAllowedFrameProps & {
        $valueInPercents: number;
        $size: number;
        $color?: string;
        $backgroundColor?: string;
        $elevation: Elevation;
    }
>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${({ $size }) => `${$size}px`};
    height: ${({ $size }) => `${$size}px`};
    border-radius: 50%;
    background: ${({ theme, $valueInPercents, $color, $backgroundColor, $elevation }) =>
        `conic-gradient(${$color || theme.legacyBackgroundPrimaryDefault} ${3.6 * $valueInPercents}deg, ${
            $backgroundColor || mapElevationToBorder({ $elevation, theme })
        } 0)`};

    ${withFrameProps}
`;

export type ProgressPieProps = AllowedFrameProps & {
    valueInPercents: number; // 0-100
    size?: number;
    color?: string;
    backgroundColor?: string;
    children?: ReactNode;
    className?: string;
};

export const ProgressPie = ({
    size = 16,
    children,
    valueInPercents,
    backgroundColor,
    className,
    color,
    ...rest
}: ProgressPieProps) => {
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedProgressPieFrameProps);

    return (
        <Container
            $size={size}
            $valueInPercents={valueInPercents}
            $backgroundColor={backgroundColor}
            $color={color}
            className={className}
            $elevation={elevation}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
