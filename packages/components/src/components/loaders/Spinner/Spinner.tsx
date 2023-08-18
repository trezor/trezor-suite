import Lottie from 'lottie-react';
import React, { useState } from 'react';
import styled from 'styled-components';
import animationStart from './animationData/refresh-spinner-start.json';
import animationMiddle from './animationData/refresh-spinner-middle.json';
import animationEnd from './animationData/refresh-spinner-end-success.json';
import animationWarn from './animationData/refresh-spinner-end-warning.json';

const StyledLottie = styled(Lottie)<Pick<FluidSpinnerProps, 'size' | 'isGrey'>>`
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    filter: ${({ isGrey }) => (isGrey ? 'grayscale(1) opacity(0.6)' : 'none')};
`;

export interface FluidSpinnerProps {
    size?: number;
    isGrey?: boolean;
    isWithSpeadup?: boolean;
    hasFinished?: boolean;
    hasError?: boolean;
    className?: string;
}

export const Spinner = ({
    size = 100,
    isGrey = true,
    isWithSpeadup,
    hasFinished,
    hasError,
    className,
}: FluidSpinnerProps) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [hasFinishedRotation, setHasFinishedRotation] = useState(false);

    const onLoopComplete = () => {
        if (!hasFinished || !hasError) {
            return;
        }

        setHasFinishedRotation(true);
    };

    const getProps = () => {
        if (hasFinished && hasFinishedRotation) {
            return {
                animationData: animationEnd,
                loop: false,
            };
        }

        if (hasError && hasFinishedRotation) {
            return {
                animationData: animationWarn,
                loop: false,
            };
        }

        if (hasStarted || !isWithSpeadup) {
            return {
                animationData: animationMiddle,
                onLoopComplete,
            };
        }

        return {
            animationData: animationStart,
            onComplete: () => setHasStarted(true),
            loop: false,
        };
    };

    return <StyledLottie size={size} isGrey={isGrey} className={className} {...getProps()} />;
};
