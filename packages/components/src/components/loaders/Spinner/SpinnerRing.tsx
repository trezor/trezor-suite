import { type AnimationEvent, useId } from 'react';

import styled, { css, keyframes } from 'styled-components';

import type { SpinnerStage } from './hooks/useSpinnerStage';

// Geometry lifted from the original Lottie artboard (24x24 user units). The tail's outer edge
// follows a r=12 circle centred at (12,12) while its inner edge follows a r=10 circle centred at
// (12,14), which is what tapers it from 4 units thick at the cap down to nothing opposite it.
const TAIL_PATH =
    'M12,4C6.4771,4 2,8.4772 2,14C2,19.5228 6.4772,24 12,24C5.3726,24 0,18.6274 0,12C0,5.3726 5.3726,0 12,0Z';

const CAP_CENTER_Y = 2;
const CAP_RADIUS = 2;

// The source loop is 51 frames at 60 fps, and the intro is 104 frames at the same rate.
const ROTATION_DURATION = '0.85s';
const REDUCED_MOTION_ROTATION_DURATION = '2s';
const INTRO_DURATION = '1.733s';

// The ring is gone by the time the result badge starts growing, 43% into its 3.233s animation.
const OUTRO_DURATION = '1.39s';

// The tail fades from 30% down to nothing, so two of them 180 degrees apart read as one ring that
// is solid at the caps and transparent opposite them.
const TAIL_MAX_OPACITY = 0.3;

const centeredTransform = css`
    transform-box: view-box;
    transform-origin: center;
`;

const rotate = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

// The source intro grows a dot out of the centre and splits it into the two caps, and only then
// draws the tail in behind them.
const growCaps = keyframes`
    from {
        transform: scale(0);
    }
    45%,
    to {
        transform: scale(1);
    }
`;

const fadeInTail = keyframes`
    from,
    55% {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const shrinkOut = keyframes`
    to {
        transform: scale(0);
        opacity: 0;
    }
`;

const Svg = styled.svg<{ $stage: SpinnerStage }>`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    ${centeredTransform}

    ${({ $stage }) =>
        $stage === 'settled' &&
        css`
            animation: ${shrinkOut} ${OUTRO_DURATION} ease-in forwards;
        `}
`;

// The rotation lives on its own element because two animations on one element cannot both drive
// `transform` -- the later one would simply replace the rotation instead of composing with it.
const Rotor = styled.g`
    ${centeredTransform}

    animation: ${rotate} ${ROTATION_DURATION} linear infinite;

    @media (prefers-reduced-motion: reduce) {
        animation-duration: ${REDUCED_MOTION_ROTATION_DURATION};
    }
`;

const Caps = styled.g<{ $stage: SpinnerStage }>`
    ${centeredTransform}

    ${({ $stage }) =>
        $stage === 'intro' &&
        css`
            animation: ${growCaps} ${INTRO_DURATION} ease-out both;
        `}
`;

const Tail = styled.g<{ $stage: SpinnerStage }>`
    ${({ $stage }) =>
        $stage === 'intro' &&
        css`
            animation: ${fadeInTail} ${INTRO_DURATION} ease-out both;
        `}
`;

type SpinnerRingProps = {
    stage: SpinnerStage;
    onIntroEnd: () => void;
    onRotationEnd: () => void;
};

export const SpinnerRing = ({ stage, onIntroEnd, onRotationEnd }: SpinnerRingProps) => {
    const gradientId = useId();

    // Animation events bubble, so ignore the ones raised by a nested group's own animation.
    const handleRotationEnd = (event: AnimationEvent<SVGGElement>) => {
        if (event.target === event.currentTarget) {
            onRotationEnd();
        }
    };

    const handleIntroEnd = (event: AnimationEvent<SVGGElement>) => {
        if (event.target === event.currentTarget) {
            onIntroEnd();
        }
    };

    return (
        <Svg viewBox="0 0 24 24" $stage={stage} aria-hidden>
            <defs>
                {/* userSpaceOnUse keeps the fade locked to the artboard, so it turns with the
                group that references it rather than with each path's own bounding box. */}
                <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1="14"
                    y1="2.0117"
                    x2="3.5"
                    y2="19.5117"
                >
                    <stop offset="0%" stopColor="currentColor" stopOpacity={TAIL_MAX_OPACITY} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>

            <Rotor onAnimationIteration={handleRotationEnd}>
                <Tail $stage={stage}>
                    <path d={TAIL_PATH} fill={`url(#${gradientId})`} />
                    <g transform="rotate(180 12 12)">
                        <path d={TAIL_PATH} fill={`url(#${gradientId})`} />
                    </g>
                </Tail>

                <Caps $stage={stage} onAnimationEnd={handleIntroEnd}>
                    <circle cx="12" cy={CAP_CENTER_Y} r={CAP_RADIUS} fill="currentColor" />
                    <circle cx="12" cy={24 - CAP_CENTER_Y} r={CAP_RADIUS} fill="currentColor" />
                </Caps>
            </Rotor>
        </Svg>
    );
};
