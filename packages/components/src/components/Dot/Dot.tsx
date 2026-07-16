import styled from 'styled-components';

import { type UIIntent } from '../../config/types';

export const dotIntents = ['neutral', 'critical'] as const;
export type DotIntent = Extract<UIIntent, (typeof dotIntents)[number]>;

const DEFAULT_SIZE = 4;

const Circle = styled.div<{ $size: number; $intent: DotIntent }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: 50%;
    background: ${({ theme, $intent }) =>
        $intent === 'critical' ? theme.elementFillCriticalBold : theme.elementFillNeutralBold};
`;

export type DotProps = {
    size?: number;
    intent?: DotIntent;
    className?: string;
    'data-testid'?: string;
};

export const Dot = ({
    size = DEFAULT_SIZE,
    intent = 'neutral',
    className,
    'data-testid': dataTestId,
}: DotProps) => (
    <Circle $size={size} $intent={intent} className={className} data-testid={dataTestId} />
);
