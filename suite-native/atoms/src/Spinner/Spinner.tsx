import { useEffect, useRef, useState } from 'react';

import LottieView from 'lottie-react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ANIMATION_SPEED = 1.5;

export type SpinnerLoadingState = 'success' | 'error' | 'idle';
type SpinnerProps = {
    loadingState: SpinnerLoadingState;
    onComplete?: () => void;
    endFrame?: number;
    size?: number;
};

const spinnerStyle = prepareNativeStyle<{ size: number }>((_, { size }) => ({
    width: size,
    height: size,
}));

const animationsMap = {
    start: require('./refresh-spinner-start.json'),
    idle: require('./refresh-spinner-middle.json'),
    success: require('./refresh-spinner-end-success.json'),
    error: require('./refresh-spinner-end-warning.json'),
};
type AnimationName = keyof typeof animationsMap;

const END_FRAME_WHITELIST: AnimationName[] = ['success', 'error'];

export const Spinner = ({ loadingState, onComplete, endFrame, size = 50 }: SpinnerProps) => {
    const animationRef = useRef<LottieView>(null);
    const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('start');
    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        const shouldPlayPartial = END_FRAME_WHITELIST.includes(currentAnimation) && endFrame;
        animationRef.current?.play(0, shouldPlayPartial ? endFrame : undefined);
    }, [currentAnimation, endFrame]);

    const handleAnimationFinish = () => {
        if (currentAnimation === 'start') {
            setCurrentAnimation('idle');
        } else if (currentAnimation === 'idle') {
            if (loadingState !== 'idle') {
                setCurrentAnimation(loadingState);
            } else {
                animationRef.current?.play(); // repeat idle animation
            }
        }

        if (currentAnimation === 'success' || currentAnimation === 'error') {
            onComplete?.();
        }
    };

    return (
        <LottieView
            resizeMode="cover"
            loop={false}
            ref={animationRef}
            speed={ANIMATION_SPEED}
            source={animationsMap[currentAnimation]}
            onAnimationFinish={handleAnimationFinish}
            style={applyStyle(spinnerStyle, { size })}
        />
    );
};
