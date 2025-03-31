import { useState } from 'react';

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

    // base/content/reverse-primary
    const colorsReplace = [
        { from: ORIGIN_COLORS_IN_ANIMATION.BODY, to: bodyColor ?? defaultBodyColor },
        {
            from: ORIGIN_COLORS_IN_ANIMATION.WARNING_BACKGROUND,
            to: warningBackgroundColor ?? defaultWarningColor,
        },
        {
            from: ORIGIN_COLORS_IN_ANIMATION.WARNING_FOREGROUND,
            to: warningForegroundColor ?? defaultWarningForegroundColor,
        },
    ];

    const getProps = () => {
        if (hasFinished && hasFinishedRotation) {
            return {
                animationData: recolorLottieAnimation(animationEnd, colorsReplace),
                loop: false,
            };
        }

        if (hasError && hasFinishedRotation) {
            return {
                animationData: recolorLottieAnimation(animationWarn, colorsReplace),
                loop: false,
            };
        }

        if (hasStarted || !hasStartAnimation) {
            return {
                animationData: recolorLottieAnimation(animationMiddle, colorsReplace),
                onLoopComplete,
            };
        }

        return {
            animationData: recolorLottieAnimation(animationStart, colorsReplace),
            onComplete: () => setHasStarted(true),
            loop: false,
        };
    };

    return (
        <StyledLottie
            size={size}
            $isGrey={isGrey}
            className={className}
            {...getProps()}
            data-testid={dataTest ? dataTest : `@spinner`}
            {...frameProps}
        />
    );
};
