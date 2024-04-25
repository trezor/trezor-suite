import { useEffect, useState } from 'react';

import Lottie from 'lottie-react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type SpinnerProps = {
    loadingResult: 'success' | 'error' | 'idle';
    onComplete?: () => void;
};

const successSpinnerStyle = prepareNativeStyle(_ => ({
    width: 50,
    height: 50,
}));

const animationResourceMap = {
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
type AnimationName = keyof typeof animationResourceMap;

export const Spinner = ({ loadingResult, onComplete }: SpinnerProps) => {
    const [animationSource, setAnimationSource] = useState<AnimationName>('start');
    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        if (currentAnimation === 'start') {
            timeoutId = setTimeout(() => {
                setCurrentAnimation('idle');
                clearTimeout(timeoutId);
            }, animationsMap[currentAnimation].duration);
        } else if (currentAnimation === 'idle') {
            setCurrentAnimation(loadingState);
            timeoutId = setTimeout(() => {
                onComplete?.();
                clearTimeout(timeoutId);
            }, animationsMap[loadingState].duration);
        }
    }, [animationSource, loadingResult, onComplete]);

    return (
        <Lottie
            source={animationResourceMap[animationSource].source}
            autoPlay
            loop={animationSource === 'idle'}
            style={applyStyle(successSpinnerStyle)}
            resizeMode="cover"
        />
    );
};
