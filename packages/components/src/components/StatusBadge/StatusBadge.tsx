import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Box } from '../Box/Box';
import { Dot } from '../Dot/Dot';
import { type DotIntent } from '../Dot/types';

const DOT_SIZE = 8;
const OUTLINE_WIDTH = 2;
const MASK_RADIUS = DOT_SIZE / 2 + OUTLINE_WIDTH;

export type StatusBadgeOffset = {
    x?: number;
    y?: number;
};

export type StatusBadgeProps = {
    isShown?: boolean;
    /** Plays the "ringing" entrance/pulse animation instead of showing a static dot. */
    isAnimated?: boolean;
    intent?: DotIntent;
    // Shift of the dot center from the top-right corner (px). Screen axes: +x right, -x left, +y down, -y up.
    offset?: StatusBadgeOffset;
    children: ReactNode;
    'data-testid'?: string;
};

const MaskedContent = styled.div<{ $x: number; $y: number }>`
    mask: radial-gradient(
        circle at calc(100% + ${({ $x }) => $x}px) ${({ $y }) => $y}px,
        transparent ${MASK_RADIUS}px,
        black ${MASK_RADIUS}px
    );
`;

const IndicatorWrapper = styled.div<{ $x: number; $y: number }>`
    position: absolute;
    display: flex;
    top: ${({ $y }) => $y - DOT_SIZE / 2}px;
    right: ${({ $x }) => -$x - DOT_SIZE / 2}px;
`;

export const StatusBadge = ({
    isShown,
    isAnimated,
    intent = 'neutral',
    offset,
    children,
    'data-testid': dataTestId,
}: StatusBadgeProps) => {
    const x = offset?.x ?? 0;
    const y = offset?.y ?? 0;

    return isShown ? (
        <Box position={{ type: 'relative' }} display="inline-flex">
            <MaskedContent $x={x} $y={y}>
                {children}
            </MaskedContent>
            <IndicatorWrapper $x={x} $y={y}>
                <Dot
                    data-testid={dataTestId}
                    size={DOT_SIZE}
                    intent={intent}
                    isAnimated={isAnimated}
                />
            </IndicatorWrapper>
        </Box>
    ) : (
        children
    );
};
