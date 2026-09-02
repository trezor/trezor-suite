import styled, { css, keyframes } from 'styled-components';

import { type DotIntent } from './types';
import { mapIntentToBackgroundColor } from './utils';

const DEFAULT_SIZE = 4;

const POP_DURATION = 380;
const PULSE_DURATION = 1400;
const PULSE_ITERATIONS = 3;
const ENTRANCE_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const popIn = keyframes`
    0% { transform: scale(0); }
    60% { transform: scale(1.25); }
    100% { transform: scale(1); }
`;

const dotPulse = keyframes`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.82); }
`;

const ringExpand = keyframes`
    0% { transform: scale(1); opacity: 0.55; }
    70% { transform: scale(2.6); opacity: 0; }
    100% { transform: scale(2.6); opacity: 0; }
`;

const Circle = styled.div<{ $size: number; $intent: DotIntent; $isAnimated: boolean }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: 50%;
    background: ${({ theme, $intent }) => theme[mapIntentToBackgroundColor($intent)]};

    ${({ $isAnimated }) =>
        $isAnimated &&
        css`
            position: relative;
            animation:
                ${popIn} ${POP_DURATION}ms ${ENTRANCE_EASE} both,
                ${dotPulse} ${PULSE_DURATION}ms ease-in-out ${POP_DURATION}ms ${PULSE_ITERATIONS};

            &::after {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: inherit;
                background: inherit;
                animation: ${ringExpand} ${PULSE_DURATION}ms ${ENTRANCE_EASE} ${PULSE_ITERATIONS};
            }

            @media (prefers-reduced-motion: reduce) {
                animation: none;

                &::after {
                    display: none;
                }
            }
        `}
`;

export type DotProps = {
    size?: number;
    intent?: DotIntent;
    isAnimated?: boolean;
    className?: string;
    'data-testid'?: string;
};

export const Dot = ({
    size = DEFAULT_SIZE,
    intent = 'neutral',
    isAnimated = false,
    className,
    'data-testid': dataTestId,
}: DotProps) => (
    <Circle
        $size={size}
        $intent={intent}
        $isAnimated={isAnimated}
        className={className}
        data-testid={dataTestId}
    />
);
