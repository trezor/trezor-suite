import { AnimatePresence, motion } from 'framer-motion';
import styled, { css, keyframes } from 'styled-components';

import { type DotIntent } from './types';
import { mapIntentToBackgroundColor } from './utils';
import { motionEasing } from '../../config/motion';

const DEFAULT_SIZE = 4;

// Timing per design handoff: 380ms pop entrance + 2 × 1400ms pulse/ring iterations.
const POP_DURATION = 380;
const PULSE_DURATION = 1400;
const PULSE_ITERATIONS = 2;
const ENTRANCE_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const EXIT_DURATION = 0.18;

export const DOT_RINGING_DURATION = POP_DURATION + PULSE_DURATION * PULSE_ITERATIONS;

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

const intentBackground = css<{ $intent: DotIntent }>`
    background: ${({ theme, $intent }) => theme[mapIntentToBackgroundColor($intent)]};
`;

const Circle = styled.div<{ $size: number; $intent: DotIntent }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: 50%;
    ${intentBackground}
`;

const RingingCircle = styled(Circle)`
    position: relative;
    animation:
        ${popIn} ${POP_DURATION}ms ${ENTRANCE_EASE} both,
        ${dotPulse} ${PULSE_DURATION}ms ease-in-out ${POP_DURATION}ms ${PULSE_ITERATIONS};

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const Ring = styled.span<{ $intent: DotIntent }>`
    position: absolute;
    inset: 0;
    border-radius: 50%;
    ${intentBackground}
    animation: ${ringExpand} ${PULSE_DURATION}ms ${ENTRANCE_EASE} ${PULSE_ITERATIONS};

    @media (prefers-reduced-motion: reduce) {
        display: none;
    }
`;

export type DotProps = {
    size?: number;
    intent?: DotIntent;
    isShown?: boolean;
    /** Plays the "ringing" entrance/pulse animation instead of showing a static dot. */
    isAnimated?: boolean;
    className?: string;
    'data-testid'?: string;
};

export const Dot = ({
    size = DEFAULT_SIZE,
    intent = 'neutral',
    isShown = true,
    isAnimated = false,
    className,
    'data-testid': dataTestId,
}: DotProps) => (
    <AnimatePresence initial={false}>
        {isShown && (
            <motion.div
                key="dot"
                style={{ display: 'flex' }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ duration: EXIT_DURATION, ease: motionEasing.exit }}
            >
                {isAnimated ? (
                    <RingingCircle
                        $size={size}
                        $intent={intent}
                        className={className}
                        data-testid={dataTestId}
                        data-phase="ringing"
                    >
                        <Ring $intent={intent} />
                    </RingingCircle>
                ) : (
                    <Circle
                        $size={size}
                        $intent={intent}
                        className={className}
                        data-testid={dataTestId}
                    />
                )}
            </motion.div>
        )}
    </AnimatePresence>
);
