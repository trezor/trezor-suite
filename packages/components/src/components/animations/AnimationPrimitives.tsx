import { type ComponentPropsWithRef } from 'react';

import styled, { type IStyledComponent, css } from 'styled-components';

import { type FrameProps, type FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export const allowedAnimationPrimitivesFrameProps = [
    'margin',
    'maxWidth',
    'maxHeight',
    'width',
    'height',
] as const satisfies FramePropsKeys[];
export type AllowedAnimationPrimitiveFrameProps = Pick<
    FrameProps,
    (typeof allowedAnimationPrimitivesFrameProps)[number]
>;

export const shapes = ['CIRCLE', 'ROUNDED', 'ROUNDED-SMALL'] as const;
export type Shape = (typeof shapes)[number];

type AnimationWrapperProps = TransientProps<AllowedAnimationPrimitiveFrameProps> & {
    shape?: Shape;
};

// Explicit type keeps the generated declaration from expanding all inferred div props.
export const AnimationWrapper: IStyledComponent<
    'web',
    ComponentPropsWithRef<'div'> & { 'data-component'?: string } & AnimationWrapperProps
> = styled.div.attrs<{ 'data-component'?: string }>(props => ({
    'data-component': props['data-component'] ?? 'AnimationWrapper',
}))<AnimationWrapperProps>`
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    ${withFrameProps}

    ${({ shape }) =>
        shape === 'CIRCLE' &&
        css`
            border-radius: 50%;
        `};
    ${({ shape }) =>
        shape === 'ROUNDED' &&
        css`
            border-radius: 32px;
        `};
    ${({ shape }) =>
        shape === 'ROUNDED-SMALL' &&
        css`
            border-radius: 4px;
        `};
`;
