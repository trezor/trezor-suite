import { useMemo, useState } from 'react';

import Lottie from 'lottie-react';
import styled, { useTheme } from 'styled-components';

import animationEnd from './animationData/refresh-spinner-end-success.json';
import animationWarn from './animationData/refresh-spinner-end-warning.json';
import animationMiddle from './animationData/refresh-spinner-middle.json';
import animationStart from './animationData/refresh-spinner-start.json';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { recolorLottieAnimation } from '../../animations/recolorLottieAnimation';

export const allowedSpinnerFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSpinnerFrameProps)[number]>;

const StyledLottie = styled(Lottie)<
    {
        size: SpinnerProps['size'];
        $isGrey: SpinnerProps['isGrey'];
    } & TransientProps<AllowedFrameProps>
>`
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    filter: ${({ $isGrey }) => ($isGrey ? 'grayscale(1) opacity(0.6)' : 'none')};

    ${withFrameProps}
`;

const ORIGIN_COLORS_IN_ANIMATION = {
    BODY: '#00854DFF',
    WARNING_BACKGROUND: '#f7bf2f',
    WARNING_FOREGROUND: '#ffffff',
};

export type SpinnerProps = AllowedFrameProps & {
    size?: number;
    isGrey?: boolean;
    hasStartAnimation?: boolean;
    hasFinished?: boolean;
    hasError?: boolean;
    className?: string;
    'data-testid'?: string;
    bodyColor?: string | null;
    warningBackgroundColor?: string | null;
    warningForegroundColor?: string | null;
};

export const Spinner = ({
    size = 100,
    isGrey = true,
    hasStartAnimation,
    hasFinished,
    hasError,
    className,
    'data-testid': dataTest,
    bodyColor,
    warningBackgroundColor,
    warningForegroundColor,
    ...rest
}: SpinnerProps) => {
    const theme = useTheme();
    const defaultBodyColor = theme.baseContentBrand;
    const defaultWarningColor = theme.baseContentWarning;
    const defaultWarningForegroundColor = theme.baseContentReversePrimary;

    const frameProps = pickAndPrepareFrameProps(rest, allowedSpinnerFrameProps);

    const [hasStarted, setHasStarted] = useState(false);
    const [hasFinishedRotation, setHasFinishedRotation] = useState(false);

    const onLoopComplete = () => {
        setHasFinishedRotation(true);
    };

    const colorsReplace = useMemo(
        () => [
            { from: ORIGIN_COLORS_IN_ANIMATION.BODY, to: bodyColor ?? defaultBodyColor },
            {
                from: ORIGIN_COLORS_IN_ANIMATION.WARNING_BACKGROUND,
                to: warningBackgroundColor ?? defaultWarningColor,
            },
            {
                from: ORIGIN_COLORS_IN_ANIMATION.WARNING_FOREGROUND,
                to: warningForegroundColor ?? defaultWarningForegroundColor,
            },
        ],
        [
            bodyColor,
            warningBackgroundColor,
            warningForegroundColor,
            defaultBodyColor,
            defaultWarningColor,
            defaultWarningForegroundColor,
        ],
    );

    const memoizedAnimations = useMemo(
        () => ({
            start: recolorLottieAnimation(animationStart, colorsReplace),
            middle: recolorLottieAnimation(animationMiddle, colorsReplace),
            end: recolorLottieAnimation(animationEnd, colorsReplace),
            warn: recolorLottieAnimation(animationWarn, colorsReplace),
        }),
        [colorsReplace],
    );

    const lottieProps = useMemo(() => {
        if (hasFinished && hasFinishedRotation) {
            return {
                animationData: memoizedAnimations.end,
                loop: false,
            };
        }

        if (hasError && hasFinishedRotation) {
            return {
                animationData: memoizedAnimations.warn,
                loop: false,
            };
        }

        if (hasStarted || !hasStartAnimation) {
            return {
                animationData: memoizedAnimations.middle,
                onLoopComplete,
            };
        }

        return {
            animationData: memoizedAnimations.start,
            onComplete: () => setHasStarted(true),
            loop: false,
        };
    }, [
        hasStarted,
        hasStartAnimation,
        hasFinished,
        hasError,
        hasFinishedRotation,
        memoizedAnimations,
    ]);

    return (
        <StyledLottie
            size={size}
            $isGrey={isGrey}
            className={className}
            data-testid={dataTest ?? '@spinner'}
            {...lottieProps}
            {...frameProps}
        />
    );
};
