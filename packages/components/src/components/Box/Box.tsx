import styled, { css } from 'styled-components';

import {
    BorderRadii,
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
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBoxFrameProps)[number]>;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $borderRadius?: BorderRadii;
        $borderWidth?: BorderWidths;
        $elevation: Elevation;
        $hasBackground?: boolean;
    }
>`
    ${({ $borderRadius }) =>
        $borderRadius &&
        css`
            border-radius: ${$borderRadius};
        `}

    ${({ $borderWidth, $elevation, theme }) =>
        $borderWidth &&
        css`
            outline: ${$borderWidth} solid ${mapElevationToBorder({ theme, $elevation })};
        `}

    ${({ $hasBackground, $elevation, theme }) =>
        $hasBackground &&
        css`
            background: ${mapElevationToBackground({ theme, $elevation })};
        `}

    ${withFrameProps}
`;

export type BoxProps = AllowedFrameProps & {
    children: React.ReactNode;
    borderRadius?: BorderRadii;
    borderWidth?: BorderWidths;
    hasBackground?: boolean;
    'data-testid'?: string;
    'aria-hidden'?: boolean;
    as?: React.ElementType;
};

export const Box = ({
    children,
    borderRadius,
    borderWidth,
    hasBackground,
    'data-testid': dataTestId,
    'aria-hidden': ariaHidden,
    as = 'div',
    ...rest
}: BoxProps) => {
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedBoxFrameProps);

    return (
        <Container
            as={as}
            data-testid={dataTestId}
            aria-hidden={ariaHidden}
            $borderRadius={borderRadius}
            $borderWidth={borderWidth}
            $hasBackground={hasBackground}
            $elevation={elevation}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
