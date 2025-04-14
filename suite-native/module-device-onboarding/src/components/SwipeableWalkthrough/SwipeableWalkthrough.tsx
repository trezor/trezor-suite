import { ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

import { AnimatedBox } from '@suite-native/atoms';

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

    return (
        <>
            <GestureDetector gesture={panGesture}>
                <AnimatedBox flex={1}>{children}</AnimatedBox>
            </GestureDetector>
        </>
    );
};
