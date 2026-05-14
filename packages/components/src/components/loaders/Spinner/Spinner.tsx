import { useMemo, useState } from 'react';

import Lottie from 'lottie-react';
import styled, { useTheme } from 'styled-components';

import animationEnd from './animationData/refresh-spinner-end-success.json';
import animationWarn from './animationData/refresh-spinner-end-warning.json';
import animationMiddle from './animationData/refresh-spinner-middle.json';
import animationStart from './animationData/refresh-spinner-start.json';
import type { SpinnerSize, SpinnerVariant } from './types';
import { getSpinnerColorsReplace } from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';
import { recolorLottieAnimation } from '../../animations/recolorLottieAnimation';

export const allowedSpinnerFrameProps = ['margin', 'opacity'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSpinnerFrameProps)[number]>;

const StyledLottie = styled(Lottie)<
    {
        size: SpinnerProps['size'];
        $isDisabled: SpinnerProps['isDisabled'];
    } & TransientProps<AllowedFrameProps>
>`
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    filter: ${({ $isDisabled }) => ($isDisabled ? 'grayscale(1) opacity(0.6)' : 'none')};
    display: flex;

    ${withFrameProps}
`;

export type SpinnerProps = AllowedFrameProps & {
    size?: SpinnerSize;
    isDisabled?: boolean;
    variant?: SpinnerVariant;
    hasStartAnimation?: boolean;
    className?: string;
    'data-testid'?: string;
};

export { spinnerSizes, spinnerVariants } from './types';
export type { SpinnerSize, SpinnerVariant } from './types';

export const Spinner = ({
    size = 40,
    isDisabled = false,
    variant = 'loading',
    hasStartAnimation,
    'data-testid': dataTest,
    ...rest
}: SpinnerProps) => {
    const theme = useTheme();
    const defaultBodyColor = theme.contentBrand;
    const defaultWarningColor = theme.contentWarning;
    const defaultWarningForegroundColor = theme.contentPrimaryInverse;

    const frameProps = pickAndPrepareFrameProps(rest, allowedSpinnerFrameProps);

    const [hasStarted, setHasStarted] = useState(false);
    const [hasFinishedRotation, setHasFinishedRotation] = useState(false);

    const onLoopComplete = () => {
        setHasFinishedRotation(true);
    };

    const colorsReplace = useMemo(
        () =>
            getSpinnerColorsReplace({
                bodyColor: defaultBodyColor,
                warningBackgroundColor: defaultWarningColor,
                warningForegroundColor: defaultWarningForegroundColor,
            }),
        [defaultBodyColor, defaultWarningColor, defaultWarningForegroundColor],
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
        if (variant === 'success' && hasFinishedRotation) {
            return {
                animationData: memoizedAnimations.end,
                loop: false,
            };
        }

        if (variant === 'error' && hasFinishedRotation) {
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
    }, [hasStarted, hasStartAnimation, variant, hasFinishedRotation, memoizedAnimations]);

    return (
        <StyledLottie
            size={size}
            $isDisabled={isDisabled}
            data-testid={dataTest ?? '@spinner'}
            {...lottieProps}
            {...frameProps}
        />
    );
};
