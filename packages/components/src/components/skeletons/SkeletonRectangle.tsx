import styled, { css } from 'styled-components';
import { DEFAULT_ELEVATION } from './consts';
import { SkeletonBaseProps } from './types';
import { getValue, shimmerEffect } from './utils';

export type SkeletonRectangleProps = SkeletonBaseProps & {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
};

export const SkeletonRectangle = styled.div<SkeletonRectangleProps>`
    width: ${({ width }) => getValue(width) ?? '80px'};
    height: ${({ height }) => getValue(height) ?? '20px'};
    background: ${({ background, theme, elevation = DEFAULT_ELEVATION }) =>
        background ?? theme[`backgroundSurfaceElevation${elevation}`]};
    border-radius: ${({ borderRadius }) => getValue(borderRadius) ?? '4px'};
    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;
