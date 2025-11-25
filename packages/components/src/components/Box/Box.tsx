import styled, { css } from 'styled-components';

import {
    BorderWidths,
    CSSColor,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
} from '@trezor/theme';

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
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBoxFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $borderWidth?: BorderWidth;
        $elevation: Elevation;
        $hasBackground?: boolean;
        $backgroundColor?: CSSColor;
        $backgroundColorOnInteraction?: CSSColor;
        $borderColor?: CSSColor;
        $shadow?: string;
    }
>`
    background: unset;
    box-shadow: unset;
    border: 0 solid
        ${({ $borderColor, $elevation, theme }) =>
            $borderColor ?? mapElevationToBorder({ theme, $elevation })};
    transition: background 0.3s ease;

    ${({ $borderWidth }) =>
        $borderWidth &&
        (typeof $borderWidth === 'object'
            ? css`
                  border-width: ${getValueWithUnit($borderWidth.top ?? $borderWidth.vertical ?? 0)}
                      ${getValueWithUnit($borderWidth.right ?? $borderWidth.horizontal ?? 0)}
                      ${getValueWithUnit($borderWidth.bottom ?? $borderWidth.vertical ?? 0)}
                      ${getValueWithUnit($borderWidth.left ?? $borderWidth.horizontal ?? 0)};
              `
            : css`
                  border-width: ${getValueWithUnit($borderWidth)};
              `)}

    ${({ $hasBackground, $elevation, theme }) =>
        $hasBackground &&
        css`
            background: ${mapElevationToBackground({ theme, $elevation })};
        `}

    ${({ $backgroundColor }) =>
        $backgroundColor &&
        css`
            background: ${$backgroundColor};
        `}

    ${({ $backgroundColorOnInteraction }) =>
        $backgroundColorOnInteraction &&
        css`
            &:hover,
            &:focus {
                background: ${$backgroundColorOnInteraction};
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

export type BoxProps = AllowedFrameProps & {
    children?: React.ReactNode;
    borderWidth?: BorderWidth;
    hasBackground?: boolean;
    // TODO: type to token names
    backgroundColor?: CSSColor;
    // TODO: type to token names
    backgroundColorOnInteraction?: CSSColor;
    // TODO: type to token names
    borderColor?: CSSColor;
    // TODO: type to token names
    shadow?: string;
    'data-testid'?: string;
    'aria-hidden'?: boolean;
    as?: React.ElementType;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    tabIndex?: number;
};

export const Box = ({
    children,
    borderWidth,
    hasBackground,
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
            $hasBackground={hasBackground}
            $elevation={elevation}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            $shadow={shadow}
            tabIndex={tabIndex}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
