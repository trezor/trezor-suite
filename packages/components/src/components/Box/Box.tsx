import { type HTMLProps } from 'react';

import styled, { css } from 'styled-components';

import { type BorderWidth, type BoxShadow, type Color } from '@trezor/theme';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { commonFocusStyles } from '../../utils/utils';

const getValueWithUnit = (value: string | number) =>
    typeof value === 'number' ? `${value}px` : value;

export const allowedBoxFrameProps = [
    'margin',
    'padding',
    'width',
    'overflow',
    'borderRadius',
    'minWidth',
    'maxWidth',
    'height',
    'minHeight',
    'maxHeight',
    'flex',
    'position',
    'cursor',
    'zIndex',
    'aspectRatio',
    'opacity',
    'userSelect',
    'pointerEvents',
    'display',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBoxFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $borderWidth?: BorderWidth;
        $borderOffset?: number;
        $backgroundColor?: Color;
        $backgroundColorOnInteraction?: Color;
        $borderColor?: Color;
        $shadow?: BoxShadow;
    }
>`
    background: unset;
    box-shadow: unset;
    outline: ${({ $borderColor, theme }) => theme[$borderColor ?? 'borderNeutral']} solid 0;
    transition: 0.2s ease-in-out;

    ${({ $borderWidth }) =>
        $borderWidth &&
        css`
            outline-width: ${getValueWithUnit($borderWidth)};
        `}

    ${({ $borderOffset }) =>
        $borderOffset !== undefined &&
        css`
            outline-offset: ${getValueWithUnit($borderOffset)};
        `}

    ${({ $backgroundColor, theme }) =>
        $backgroundColor &&
        css`
            background: ${theme[$backgroundColor]};
        `}

    ${({ $backgroundColorOnInteraction, theme }) =>
        $backgroundColorOnInteraction &&
        css`
            &:hover,
            &:focus {
                background: ${theme[$backgroundColorOnInteraction]};
            }
        `}

    ${({ $shadow }) =>
        $shadow &&
        css`
            box-shadow: ${({ theme }) => theme[$shadow]};
        `}

    &:focus-visible {
        ${commonFocusStyles}
    }

    ${withFrameProps};
`;

export type BoxProps = Pick<
    HTMLProps<HTMLElement>,
    'onClick' | 'onMouseEnter' | 'onMouseLeave' | 'tabIndex'
> &
    AllowedFrameProps & {
        children?: React.ReactNode;
        borderWidth?: BorderWidth;
        borderOffset?: number;
        backgroundColor?: Color;
        backgroundColorOnInteraction?: Color;
        borderColor?: Color;
        shadow?: BoxShadow;
        'data-testid'?: string;
        'aria-hidden'?: boolean;
        as?: React.ElementType;
        ref?: React.RefObject<HTMLElement | null>;
    };

export const Box = ({
    children,
    borderWidth,
    borderOffset,
    backgroundColor,
    backgroundColorOnInteraction,
    borderColor,
    shadow,
    'data-testid': dataTestId,
    'aria-hidden': ariaHidden,
    as = 'div',
    onClick,
    onMouseEnter,
    onMouseLeave,
    tabIndex,
    ref,
    ...rest
}: BoxProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedBoxFrameProps);

    return (
        <Container
            as={as}
            data-testid={dataTestId}
            aria-hidden={ariaHidden}
            $borderWidth={borderWidth}
            $borderOffset={borderOffset}
            $backgroundColor={backgroundColor}
            $backgroundColorOnInteraction={backgroundColorOnInteraction}
            $borderColor={borderColor}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            $shadow={shadow}
            tabIndex={tabIndex}
            ref={ref}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
