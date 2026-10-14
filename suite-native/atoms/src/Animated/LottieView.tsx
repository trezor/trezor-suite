import { type ComponentProps, type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import NativeLottieView from 'lottie-react-native';

export type LottieViewRef = Pick<NativeLottieView, 'play' | 'pause' | 'resume' | 'reset'>;

type LottieViewProps = Omit<ComponentProps<typeof NativeLottieView>, 'key' | 'ref'> & {
    ref?: Ref<LottieViewRef>;
    reducedMotionProgress?: number;
};

export const LottieView = ({
    ref,
    autoPlay,
    loop,
    progress,
    speed,
    duration,
    onAnimationFinish,
    reducedMotionProgress = 0.5,
    ...props
}: LottieViewProps) => {
    const isReducedMotion = useReducedMotion();
    const animationRef = useRef<NativeLottieView>(null);

    useImperativeHandle(
        ref,
        () => ({
            play: (startFrame, endFrame) => {
                if (!isReducedMotion) animationRef.current?.play(startFrame, endFrame);
            },
            pause: () => animationRef.current?.pause(),
            resume: () => {
                if (!isReducedMotion) animationRef.current?.resume();
            },
            reset: () => {
                if (!isReducedMotion) animationRef.current?.reset();
            },
        }),
        [isReducedMotion],
    );

    useEffect(() => {
        if (isReducedMotion) animationRef.current?.pause();
    }, [isReducedMotion]);

    return (
        <NativeLottieView
            {...props}
            ref={animationRef}
            autoPlay={isReducedMotion ? false : autoPlay}
            loop={isReducedMotion ? false : loop}
            progress={isReducedMotion ? reducedMotionProgress : progress}
            speed={isReducedMotion ? 0 : speed}
            duration={isReducedMotion ? undefined : duration}
            onAnimationFinish={isReducedMotion ? undefined : onAnimationFinish}
        />
    );
};
