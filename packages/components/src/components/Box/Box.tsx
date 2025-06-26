import styled, { css } from 'styled-components';

import {
    BorderWidths,
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
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBoxFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $borderWidth?: BorderWidth;
        $elevation: Elevation;
        $hasBackground?: boolean;
    }
>`
    border: 0 solid ${mapElevationToBorder};
    transition: background 0.2s ease;

    ${({ $borderRadius }) =>
        $borderRadius &&
        css`
            border-radius: ${$borderRadius};
        `}

    ${({ $borderWidth }) =>
        $borderWidth &&
        (typeof $borderWidth === 'object'
            ? css`
                  border-width: ${$borderWidth.top ?? $borderWidth.vertical ?? 0}
                      ${$borderWidth.right ?? $borderWidth.horizontal ?? 0}
                      ${$borderWidth.bottom ?? $borderWidth.vertical ?? 0}
                      ${$borderWidth.left ?? $borderWidth.horizontal ?? 0};
              `
            : css`
                  border-width: ${$borderWidth};
              `)}

        ${({ $hasBackground, $elevation, theme }) =>
        $hasBackground &&
        css`
            background: ${mapElevationToBackground({ theme, $elevation })};
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
    children: React.ReactNode;
    borderWidth?: BorderWidth;
    hasBackground?: boolean;
    'data-testid'?: string;
    'aria-hidden'?: boolean;
    as?: React.ElementType;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

export const Box = ({
    children,
    borderWidth,
    hasBackground,
    'data-testid': dataTestId,
    'aria-hidden': ariaHidden,
    as = 'div',
    onClick,
    onMouseEnter,
    onMouseLeave,
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
            $hasBackground={hasBackground}
            $elevation={elevation}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
