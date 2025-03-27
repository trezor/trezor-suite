import { ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

import { AnimatedBox } from '@suite-native/atoms';

import { WALLET_BACKUP_TUTORIAL_STEPS_COUNT } from '../../constants';

type SwipeableWalkthroughProps = {
    children: ReactNode;
    currentStepIndex: SharedValue<number>;
};

const PAN_GESTURE_DETECTION_THRESHOLD = 50;

export const SwipeableWalkthrough = ({ children, currentStepIndex }: SwipeableWalkthroughProps) => {
    const panGesture = Gesture.Pan().onEnd(event => {
        const { translationY } = event;

        if (
            translationY < -PAN_GESTURE_DETECTION_THRESHOLD &&
            currentStepIndex.value < WALLET_BACKUP_TUTORIAL_STEPS_COUNT - 1
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
