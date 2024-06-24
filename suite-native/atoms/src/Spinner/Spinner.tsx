import { useRef, useState } from 'react';

import Lottie from 'lottie-react-native';
import LottieView from 'lottie-react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ANIMATION_SPEED = 1.5;

export type SpinnerLoadingState = 'success' | 'error' | 'idle';
type SpinnerProps = {
    loadingState: SpinnerLoadingState;
    onComplete?: () => void;
};

const spinnerStyle = prepareNativeStyle(_ => ({
    width: 50,
    height: 50,
}));

const animationsMap = {
    start: require('./refresh-spinner-start.json'),
    idle: require('./refresh-spinner-middle.json'),
    success: require('./refresh-spinner-end-success.json'),
    error: require('./refresh-spinner-end-warning.json'),
};
type AnimationName = keyof typeof animationsMap;

export const Spinner = ({ loadingState, onComplete }: SpinnerProps) => {
    const animationRef = useRef<LottieView>(null);
    const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('start');
    const { applyStyle } = useNativeStyles();

    const handleAnimationFinish = () => {
        if (currentAnimation === 'start') {
            setCurrentAnimation('idle');
        } else if (currentAnimation === 'idle') {
            setCurrentAnimation(loadingState);
        }

        if (currentAnimation === 'success' || currentAnimation === 'error') {
            onComplete?.();

            return;
        }

        // Play the next loop of the animation.
        animationRef.current?.play();
    };

    return (
        <Lottie
            autoPlay
            resizeMode="cover"
            loop={false}
            ref={animationRef}
            speed={ANIMATION_SPEED}
            source={animationsMap[currentAnimation]}
            onAnimationFinish={handleAnimationFinish}
            style={applyStyle(spinnerStyle)}
        />
    );
};
