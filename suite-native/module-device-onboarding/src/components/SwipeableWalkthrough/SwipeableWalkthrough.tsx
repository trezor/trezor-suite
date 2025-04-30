import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { UIManager, View, _Text, findNodeHandle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

import { AnimatedBox, Box } from '@suite-native/atoms';

import { SwipeableWalkthroughContext } from '../../hooks/useSwipeableWalkthroughStepHeight';

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
    const [offsetTop, setOffsetTop] = useState(0);
    console.log('TCL: [offsetTop', offsetTop);
    const boxRef = useRef<View>(null);

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
        <Box
            flex={1}
            onLayout={() => {
                boxRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    // Get the distance from the top of the screen.
                    console.log('TCL: SwipeableWalkthrough -> x', x);
                    console.log('TCL: SwipeableWalkthrough -> pageY', pageY);

                    setOffsetTop(y); // maybe use pageY instead?
                });
            }}
        >
            <GestureDetector gesture={panGesture}>
                <AnimatedBox flex={1} ref={boxRef}>
                    <SwipeableWalkthroughContext.Provider value={{ offsetTop }}>
                        {children}
                    </SwipeableWalkthroughContext.Provider>
                </AnimatedBox>
            </GestureDetector>
        </Box>
    );
};
