import { ReactNode, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

import { AnimatedBox } from '@suite-native/atoms';

import { useSwipeableWalkthroughStepHeight } from '../../hooks/useSwipeableWalkthroughStepHeight';

type SwipeableWalkthroughProps = {
    children: ReactNode;
    currentStepIndex: SharedValue<number>;
    totalSteps: number;
};

const PAN_GESTURE_DETECTION_THRESHOLD = 50;

export const SwipeableWalkthrough = ({
    children,
    currentStepIndex,
    totalSteps,
}: SwipeableWalkthroughProps) => {
    const breakpointRef = useRef<View>(null);
    const { setStepLayoutHeight } = useSwipeableWalkthroughStepHeight();
    const panGesture = Gesture.Pan().onEnd(event => {
        const { translationY } = event;

        if (
            translationY < -PAN_GESTURE_DETECTION_THRESHOLD &&
            currentStepIndex.value < totalSteps - 1
        ) {
            currentStepIndex.value += 1;
        } else if (translationY > PAN_GESTURE_DETECTION_THRESHOLD && currentStepIndex.value > 0) {
            currentStepIndex.value -= 1;
        }
    });

    const onLayout = () => {
        breakpointRef?.current?.measure((_x, _y, _width, height) => {
            setStepLayoutHeight(height);
        });
    };

    return (
        <>
            <GestureDetector gesture={panGesture}>
                <AnimatedBox onLayout={onLayout} ref={breakpointRef} flex={1}>
                    {children}
                </AnimatedBox>
            </GestureDetector>
        </>
    );
};
