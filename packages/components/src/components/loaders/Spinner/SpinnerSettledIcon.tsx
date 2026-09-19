import styled, { keyframes } from 'styled-components';

import type { SpinnerVariant } from './types';

export type SpinnerSettledVariant = Exclude<SpinnerVariant, 'loading'>;

const BADGE_RADIUS = 7;
const GLYPH_STROKE_WIDTH = 1.5;

// The source result animation is 194 frames at 60 fps.
const SETTLE_DURATION = '3.233s';

// Scale envelope sampled off the source animation: nothing is drawn until the ring has collapsed at
// 43%, the badge then overshoots to 15.2 units, settles at its 14-unit size, holds, and finally
// shrinks away -- it is meant to disappear once the content it stood in for is ready.
const settle = keyframes`
    from {
        transform: scale(0);
    }
    43% {
        transform: scale(0);
    }
    58% {
        transform: scale(1.087);
    }
    65% {
        transform: scale(1);
    }
    80% {
        transform: scale(1);
    }
    to {
        transform: scale(0);
    }
`;

const Svg = styled.svg`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform-box: view-box;
    transform-origin: center;

    animation: ${settle} ${SETTLE_DURATION} ease-in-out forwards;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const Badge = styled.circle<{ $variant: SpinnerSettledVariant; $isDisabled: boolean }>`
    fill: ${({ theme, $variant, $isDisabled }) => {
        if ($isDisabled) {
            return theme.contentDisabled;
        }

        return $variant === 'success' ? theme.contentBrand : theme.contentWarning;
    }};
`;

const Glyph = styled.g`
    fill: ${({ theme }) => theme.contentPrimaryInverse};
    stroke: ${({ theme }) => theme.contentPrimaryInverse};
    stroke-width: ${GLYPH_STROKE_WIDTH};
    stroke-linecap: round;
    stroke-linejoin: round;
`;

type SpinnerSettledIconProps = {
    variant: SpinnerSettledVariant;
    isDisabled: boolean;
};

export const SpinnerSettledIcon = ({ variant, isDisabled }: SpinnerSettledIconProps) => (
    <Svg viewBox="0 0 24 24" aria-hidden>
        <Badge cx="12" cy="12" r={BADGE_RADIUS} $variant={variant} $isDisabled={isDisabled} />

        <Glyph>
            {variant === 'success' ? (
                <path d="M15.209,10.25 L10.929,14.333 L8.792,12.292" fill="none" />
            ) : (
                <>
                    <path d="M12,7.488 L12,12.488" fill="none" />
                    <circle cx="12" cy="15.488" r="1" stroke="none" />
                </>
            )}
        </Glyph>
    </Svg>
);
