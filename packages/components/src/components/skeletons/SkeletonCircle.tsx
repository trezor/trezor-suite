import styled, { css } from 'styled-components';
import { DEFAULT_ELEVATION } from './consts';
import { getValue, shimmerEffect } from './utils';
import { SkeletonBaseProps } from './types';

export type SkeletonCircleProps = SkeletonBaseProps & {
    size?: string | number;
};

export const SkeletonCircle = styled.div<SkeletonCircleProps>`
    ${({ size }) => `
        width: ${getValue(size) ?? '24px'};
        height: ${getValue(size) ?? '24px'};
        border-radius: ${getValue(size) ?? '24px'};
    `}
    background: ${({ background, theme, elevation = DEFAULT_ELEVATION }) =>
        background ?? theme[`backgroundSurfaceElevation${elevation}`]};

    background-size: 200%;

    ${props =>
        props.animate &&
        css`
            ${shimmerEffect}
        `}
`;
