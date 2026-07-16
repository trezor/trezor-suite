import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Box, Dot, type DotIntent } from '@trezor/components';

const DOT_SIZE = 8;
const OUTLINE_WIDTH = 2;
const DOT_OFFSET = 4;
const MASK_RADIUS = DOT_SIZE / 2 + OUTLINE_WIDTH;
const DOT_CENTER = DOT_SIZE / 2 - DOT_OFFSET;

type StatusIndicatorProps = {
    show?: boolean;
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

export const StatusIndicator = ({
    show,
    intent = 'neutral',
    children,
    'data-testid': dataTestId,
}: StatusIndicatorProps) =>
    show ? (
        <Box position={{ type: 'relative' }}>
            <MaskedContent>{children}</MaskedContent>
            <IndicatorWrapper>
                <Dot data-testid={dataTestId} size={DOT_SIZE} intent={intent} />
            </IndicatorWrapper>
        </Box>
    ) : (
        children
    );
