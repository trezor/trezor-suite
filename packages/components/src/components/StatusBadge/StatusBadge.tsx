import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Box } from '../Box/Box';
import { Dot, type DotIntent } from '../Dot/Dot';

const DOT_SIZE = 8;
const OUTLINE_WIDTH = 2;
const DOT_OFFSET = 4;
const MASK_RADIUS = DOT_SIZE / 2 + OUTLINE_WIDTH;
const DOT_CENTER = DOT_SIZE / 2 - DOT_OFFSET;

export type StatusBadgeProps = {
    isShown?: boolean;
    intent?: DotIntent;
    children: ReactNode;
    'data-testid'?: string;
};

const MaskedContent = styled.div`
    mask: radial-gradient(
        circle at calc(100% - ${DOT_CENTER}px) ${DOT_CENTER}px,
        transparent ${MASK_RADIUS}px,
        black ${MASK_RADIUS}px
    );
`;

const IndicatorWrapper = styled.div`
    position: absolute;
    top: -${DOT_OFFSET}px;
    right: -${DOT_OFFSET}px;
    display: flex;
`;

export const StatusBadge = ({
    isShown,
    intent = 'neutral',
    children,
    'data-testid': dataTestId,
}: StatusBadgeProps) =>
    isShown ? (
        <Box position={{ type: 'relative' }} display="inline-flex">
            <MaskedContent>{children}</MaskedContent>
            <IndicatorWrapper>
                <Dot data-testid={dataTestId} size={DOT_SIZE} intent={intent} />
            </IndicatorWrapper>
        </Box>
    ) : (
        children
    );
