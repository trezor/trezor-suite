import { HTMLProps } from 'react';

import styled, { css } from 'styled-components';

import { BorderWidths, Color, Elevation, mapElevationToBorder } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { useElevation } from '../ElevationContext/ElevationContext';

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
        $elevation: Elevation;
        $backgroundColor?: Color;
        $backgroundColorOnInteraction?: Color;
        $borderColor?: Color;
        $shadow?: string;
    }
>`
    background: unset;
    box-shadow: unset;
    border: 0 solid
        ${({ $borderColor, $elevation, theme }) =>
            $borderColor ? theme[$borderColor] : mapElevationToBorder({ theme, $elevation })};
    transition: background 0.3s ease;

    ${({ $borderWidth }) => {
        if ($borderWidth == null || $borderWidth === 0) return null;
        if (typeof $borderWidth === 'object') {
            return css`
                border-width: ${getValueWithUnit($borderWidth.top ?? $borderWidth.vertical ?? 0)}
                    ${getValueWithUnit($borderWidth.right ?? $borderWidth.horizontal ?? 0)}
                    ${getValueWithUnit($borderWidth.bottom ?? $borderWidth.vertical ?? 0)}
                    ${getValueWithUnit($borderWidth.left ?? $borderWidth.horizontal ?? 0)};
            `;
        }

        return css`
            border-width: ${getValueWithUnit($borderWidth)};
        `;
    }}

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
            box-shadow: ${$shadow};
        `}

    ${withFrameProps};
`;

type BorderWidth =
    | {
          top?: BorderWidths;
          bottom?: BorderWidths;
          left?: BorderWidths;
          right?: BorderWidths;
          horizontal?: BorderWidths;
          vertical?: BorderWidths;
      }
    | BorderWidths;

export type BoxProps = Pick<
    HTMLProps<HTMLElement>,
    'onClick' | 'onMouseEnter' | 'onMouseLeave' | 'tabIndex'
> &
    AllowedFrameProps & {
        children?: React.ReactNode;
        borderWidth?: BorderWidth;
        backgroundColor?: Color;
        backgroundColorOnInteraction?: Color;
        borderColor?: Color;
        shadow?: string;
        'data-testid'?: string;
        'aria-hidden'?: boolean;
        as?: React.ElementType;
        ref?: React.RefObject<HTMLElement | null>;
    };

export const Box = ({
    children,
    borderWidth,
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
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedBoxFrameProps);

    return (
        <Container
            as={as}
            data-testid={dataTestId}
            aria-hidden={ariaHidden}
            $borderWidth={borderWidth}
            $backgroundColor={backgroundColor}
            $backgroundColorOnInteraction={backgroundColorOnInteraction}
            $borderColor={borderColor}
            $elevation={elevation}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            $shadow={shadow}
            tabIndex={tabIndex}
            ref={ref as React.Ref<HTMLDivElement>}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
