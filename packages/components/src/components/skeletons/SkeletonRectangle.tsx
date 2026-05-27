import styled, { css } from 'styled-components';

import { type Elevation, borders, mapElevationToBackground } from '@trezor/theme';

import { type SkeletonBaseProps } from './types';
import { type AllowedFrameProps, allowedSkeletonFrameProps, shimmerEffect } from './utils';
import { pickAndPrepareFrameProps, withFrameProps } from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { useElevation } from '../ElevationContext/ElevationContext';

export type SkeletonRectangleProps = SkeletonBaseProps & AllowedFrameProps;

const StyledSkeletonRectangle = styled.div<
    TransientProps<SkeletonRectangleProps> & {
        $elevation: Elevation;
    } & TransientProps<AllowedFrameProps>
>`
    background: ${({ $background, ...props }) => $background ?? mapElevationToBackground(props)};
    background-size: 200%;

    ${props =>
        props.$animate &&
        css<{ $elevation: Elevation }>`
            ${shimmerEffect}
        `}

    ${withFrameProps}
`;

export const SkeletonRectangle = ({ animate, background, ...rest }: SkeletonRectangleProps) => {
    const { elevation } = useElevation();

    const frameProps = pickAndPrepareFrameProps(
        {
            width: 80,
            height: 20,
            borderRadius: borders.radii.xs,
            ...rest,
        },
        allowedSkeletonFrameProps,
    );

    return (
        <StyledSkeletonRectangle
            $elevation={elevation}
            $animate={animate}
            $background={background}
            {...frameProps}
        />
    );
};
