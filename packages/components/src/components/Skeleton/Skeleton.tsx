import styled, { css, keyframes } from 'styled-components';

import { borders } from '@trezor/theme';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export const allowedSkeletonFrameProps = [
    'margin',
    'width',
    'height',
    'borderRadius',
] as const satisfies FramePropsKeys[];

type AllowedFrameProps = Pick<FrameProps, (typeof allowedSkeletonFrameProps)[number]>;

const SHINE = keyframes`
    from {
        background-position: 0 0;
    }
    to {
        background-position: -200% 0;
    }
`;

const shimmerEffect = css`
    animation: ${SHINE} 1.5s ease infinite;
    background: linear-gradient(
        90deg,
        ${({ theme }) => theme.elementFillNeutralSofter},
        ${({ theme }) => theme.elementFillFieldDisabled},
        ${({ theme }) => theme.elementFillNeutralSofter}
    );
    background-size: 200%;
`;

type SkeletonBaseProps = {
    animate?: boolean;
} & Pick<AllowedFrameProps, 'margin' | 'borderRadius'>;

export type SkeletonRectangleProps = SkeletonBaseProps & {
    type?: 'rectangle';
    width?: number | string;
    height?: number | string;
    size?: never;
};

export type SkeletonCircleProps = SkeletonBaseProps & {
    type: 'circle';
    size?: number;
    width?: never;
    height?: never;
};

export type SkeletonProps = SkeletonRectangleProps | SkeletonCircleProps;

type StyledSkeletonProps = TransientProps<AllowedFrameProps & { animate?: boolean }>;

const StyledSkeleton = styled.div<StyledSkeletonProps>`
    background: ${({ theme }) => theme.elementFillNeutralSofter};

    ${({ $animate }) =>
        $animate
            ? css`
                  ${shimmerEffect}
              `
            : undefined}

    ${withFrameProps}
`;

export const Skeleton = ({ type = 'rectangle', animate, ...rest }: SkeletonProps) => {
    const frameProps = pickAndPrepareFrameProps(
        type === 'circle'
            ? {
                  width: rest.size ?? 24,
                  height: rest.size ?? 24,
                  borderRadius: rest.borderRadius ?? borders.radii.full,
                  margin: rest.margin,
              }
            : {
                  width: rest.width ?? 80,
                  height: rest.height ?? 20,
                  borderRadius: rest.borderRadius ?? borders.radii.xs,
                  margin: rest.margin,
              },
        allowedSkeletonFrameProps,
    );

    return <StyledSkeleton $animate={animate} {...frameProps} />;
};
