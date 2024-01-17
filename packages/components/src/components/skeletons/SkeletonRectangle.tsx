import styled, { css } from 'styled-components';
import { SkeletonBaseProps } from './types';
import { getValue, shimmerEffect } from './utils';
import { Elevation, mapElevationToBackground } from '@trezor/theme/src/elevation';
import { useElevation } from '../ElevationContext/ElevationContext';

export type SkeletonRectangleProps = SkeletonBaseProps & {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
};

const StyledSkeletonRectangle = styled.div<SkeletonRectangleProps & { elevation: Elevation }>`
    width: ${({ width }) => getValue(width) ?? '80px'};
    height: ${({ height }) => getValue(height) ?? '20px'};
    background: ${({ background, theme, elevation }) =>
        background ?? theme[mapElevationToBackground[elevation]]};
    border-radius: ${({ borderRadius }) => getValue(borderRadius) ?? '4px'};
    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;

export const SkeletonRectangle = (props: SkeletonRectangleProps) => {
    const { elevation } = useElevation();

    return <StyledSkeletonRectangle {...props} elevation={elevation} />;
};
