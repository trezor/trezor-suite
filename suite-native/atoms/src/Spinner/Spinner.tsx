import { useEffect, useState } from 'react';

import Lottie from 'lottie-react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type SpinnerLoadingState = 'success' | 'error' | 'idle';
type SpinnerProps = {
    loadingState: SpinnerLoadingState;
    onComplete?: () => void;
};

const successSpinnerStyle = prepareNativeStyle(_ => ({
    width: 50,
    height: 50,
}));

const animationsMap = {
    start: {
        source: require('./refresh-spinner-start.json'),
        duration: 2_000,
    },
    idle: {
        source: require('./refresh-spinner-middle.json'),
        duration: 1_000,
    },
    success: {
        source: require('./refresh-spinner-end-success.json'),
        duration: 3_000,
    },
    error: {
        source: require('./refresh-spinner-end-warning.json'),
        duration: 3_000,
    },
};
type AnimationName = keyof typeof animationsMap;

export const Spinner = ({ loadingState, onComplete }: SpinnerProps) => {
    const [currentAnimation, setCurrentAnimation] = useState<AnimationName>('start');
    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        // Clear timeout happens straight after the timeout function is called to simplify code because
        // the timeout is in the if block, meaning it wouldn't be available in the useEffect cleanup function.
        if (currentAnimation === 'start') {
            const timeout = setTimeout(() => {
                setCurrentAnimation('idle');
                clearTimeout(timeout);
            }, animationsMap[currentAnimation].duration);
        } else if (currentAnimation === 'idle') {
            setCurrentAnimation(loadingState);
        } else if (currentAnimation === 'success' || currentAnimation === 'error') {
            const timeout = setTimeout(() => {
                onComplete?.();
                clearTimeout(timeout);
            }, animationsMap[loadingState].duration);
        }
    }, [currentAnimation, loadingState, onComplete]);

    return (
        <Lottie
            source={animationsMap[currentAnimation].source}
            autoPlay
            loop={currentAnimation === 'idle'}
            style={applyStyle(successSpinnerStyle)}
            resizeMode="cover"
        />
    );
};
