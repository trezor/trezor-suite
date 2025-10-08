import styled, { CSSProperties, css } from 'styled-components';

import { borders } from '@trezor/theme';

import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedAnimationPrimitivesFrameProps = [
    'margin',
    'maxWidth',
    'maxHeight',
] as const satisfies FramePropsKeys[];
export type AllowedAnimationPrimitiveFrameProps = Pick<
    FrameProps,
    (typeof allowedAnimationPrimitivesFrameProps)[number]
>;

export const shapes = ['CIRCLE', 'ROUNDED', 'ROUNDED-SMALL'] as const;
export type Shape = (typeof shapes)[number];

export const AnimationWrapper = styled.div<
    TransientProps<AllowedAnimationPrimitiveFrameProps> & {
        height?: CSSProperties['height'];
        width?: CSSProperties['width'];
        shape?: Shape;
    }
>`
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    width: ${({ width }) => width};
    height: ${({ height }) => height};

    ${withFrameProps}

    ${({ shape }) =>
        shape === 'CIRCLE' &&
        css`
            border-radius: 50%;
        `};
    ${({ shape }) =>
        shape === 'ROUNDED' &&
        css`
            border-radius: 30px;
        `};
    ${({ shape }) =>
        shape === 'ROUNDED-SMALL' &&
        css`
            border-radius: ${borders.radii.xs};
        `};
`;
