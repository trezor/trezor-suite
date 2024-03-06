import styled, { css } from 'styled-components';
import { SkeletonBaseProps } from './types';
import { getValue, shimmerEffect } from './utils';
import { Elevation, borders, mapElevationToBackground } from '@trezor/theme';
import { useElevation } from '../ElevationContext/ElevationContext';
import { TransientProps } from '../../utils/transientProps';

export type SkeletonRectangleProps = SkeletonBaseProps & {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
};

const StyledSkeletonRectangle = styled.div<
    TransientProps<SkeletonRectangleProps> & { $elevation: Elevation }
>`
    width: ${({ $width }) => getValue($width) ?? '80px'};
    height: ${({ $height }) => getValue($height) ?? '20px'};
    background: ${({ $background, ...props }) => $background ?? mapElevationToBackground(props)};
    border-radius: ${({ $borderRadius }) => getValue($borderRadius) ?? borders.radii.xs};
    background-size: 200%;

    ${props =>
        props.$animate &&
        css<{ $elevation: Elevation }>`
            ${shimmerEffect}
        `}
`;

export const SkeletonRectangle = (props: SkeletonRectangleProps) => {
    const { elevation } = useElevation();

    return (
        <StyledSkeletonRectangle
            $elevation={elevation}
            $borderRadius={props.borderRadius}
            $width={props.width}
            $height={props.height}
            $animate={props.animate}
            $background={props.background}
        />
    );
};
