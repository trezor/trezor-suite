import styled, { css } from 'styled-components';
import { getValue, shimmerEffect } from './utils';
import { SkeletonBaseProps } from './types';
import { Elevation, mapElevationToBackground } from '@trezor/theme';
import { useElevation } from '../ElevationContext/ElevationContext';
import { TransientProps } from '../../utils/transientProps';

export type SkeletonCircleProps = SkeletonBaseProps & {
    size?: string | number;
};

const StyledSkeletonCircle = styled.div<
    TransientProps<SkeletonCircleProps> & { $elevation: Elevation }
>`
    ${({ $size }) => `
        width: ${getValue($size) ?? '24px'};
        height: ${getValue($size) ?? '24px'};
        border-radius: ${getValue($size) ?? '24px'};
    `}
    background: ${({ $background, ...props }) => $background ?? mapElevationToBackground(props)};

    background-size: 200%;

    ${props =>
        props.$animate &&
        css<{ $elevation: Elevation }>`
            ${shimmerEffect}
        `}
`;

export const SkeletonCircle = (props: SkeletonCircleProps) => {
    const { elevation } = useElevation();

    return (
        <StyledSkeletonCircle
            $elevation={elevation}
            $size={props.size}
            $animate={props.animate}
            $background={props.background}
        />
    );
};
