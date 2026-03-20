import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Box } from '@trezor/components';

import { type BackendStatus } from './getBackendStatus';

const DOT_SIZE = 10;
const OUTLINE_WIDTH = 2;
const DOT_OFFSET = 4;
const MASK_RADIUS = DOT_SIZE / 2 + OUTLINE_WIDTH;
const DOT_CENTER = DOT_SIZE / 2 - DOT_OFFSET;

type StatusIndicatorProps = {
    status?: BackendStatus;
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

const Indicator = styled.div`
    position: absolute;
    top: -${DOT_OFFSET}px;
    right: -${DOT_OFFSET}px;
    width: ${DOT_SIZE}px;
    height: ${DOT_SIZE}px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.elementFillNeutralBold};
`;

export const StatusIndicator = ({
    status,
    children,
    'data-testid': dataTestId,
}: StatusIndicatorProps) =>
    status ? (
        <Box position={{ type: 'relative' }}>
            <MaskedContent>{children}</MaskedContent>
            <Indicator data-testid={dataTestId} />
        </Box>
    ) : (
        children
    );
