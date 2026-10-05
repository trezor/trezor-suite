import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { LottieView, type LottieViewRef } from '../Animated/LottieView';

const ANIMATION_SPEED = 1.5;

export const SPINNER_LOADING_STATES = ['success', 'error', 'idle'] as const;
export type SpinnerLoadingState = (typeof SPINNER_LOADING_STATES)[number];
export type SpinnerProps = {
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
    const animationRef = useRef<LottieViewRef>(null);
    const completedLoadingState = useRef<SpinnerLoadingState>('idle');
    const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('start');
    const { applyStyle } = useNativeStyles();
    const isReducedMotion = useReducedMotion();

    useEffect(() => {
        if (isReducedMotion) return;

        const shouldPlayPartial = END_FRAME_WHITELIST.includes(currentAnimation) && endFrame;
        animationRef.current?.play(0, shouldPlayPartial ? endFrame : undefined);
    }, [currentAnimation, endFrame, isReducedMotion]);

    useEffect(() => {
        // Completion must not depend on an animation finishing when playback is disabled.
        if (isReducedMotion && completedLoadingState.current !== loadingState) {
            completedLoadingState.current = loadingState;
            if (loadingState !== 'idle') onComplete?.();
        }
    }, [isReducedMotion, loadingState, onComplete]);

    const handleAnimationFinish = () => {
        if (currentAnimation === 'start') {
            setCurrentAnimation('idle');
        } else if (currentAnimation === 'idle') {
            if (loadingState !== 'idle') {
                setCurrentAnimation(loadingState);
            }
            animationRef.current?.play(); // repeat idle animation
        }

        if (currentAnimation === 'success' || currentAnimation === 'error') {
            onComplete?.();
        }
    };

    const displayedAnimation = isReducedMotion ? loadingState : currentAnimation;
    const source = animationsMap[displayedAnimation];
    const endProgress =
        endFrame === undefined
            ? 1
            : Math.max(0, Math.min(1, (endFrame - source.ip) / (source.op - source.ip)));
    const reducedMotionProgress = displayedAnimation === 'idle' ? 0.5 : endProgress;

    return (
        <LottieView
            resizeMode="cover"
            loop={false}
            ref={animationRef}
            speed={ANIMATION_SPEED}
            source={source}
            reducedMotionProgress={reducedMotionProgress}
            onAnimationFinish={handleAnimationFinish}
            style={applyStyle(spinnerStyle, { size })}
        />
    );
};
