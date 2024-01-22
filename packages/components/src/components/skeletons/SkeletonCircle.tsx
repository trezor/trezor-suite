import styled, { css } from 'styled-components';
import { getValue, shimmerEffect } from './utils';
import { SkeletonBaseProps } from './types';
import { Elevation, mapElevationToBackground } from '@trezor/theme';
import { useElevation } from '../ElevationContext/ElevationContext';

export type SkeletonCircleProps = SkeletonBaseProps & {
    size?: string | number;
};

const StyledSkeletonCircle = styled.div<SkeletonCircleProps & { elevation: Elevation }>`
    ${({ size }) => `
        width: ${getValue(size) ?? '24px'};
        height: ${getValue(size) ?? '24px'};
        border-radius: ${getValue(size) ?? '24px'};
    `}
    background: ${({ background, theme, elevation }) =>
        background ?? theme[mapElevationToBackground[elevation]]};

    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;

export const SkeletonCircle = (props: SkeletonCircleProps) => {
    const { elevation } = useElevation();

    return <StyledSkeletonCircle {...props} elevation={elevation} />;
};
