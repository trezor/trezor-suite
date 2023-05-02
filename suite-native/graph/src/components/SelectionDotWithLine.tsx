import React, { useCallback } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import {
    vec,
    runSpring,
    useValue,
    useComputedValue,
    Circle,
    Group,
    Line,
} from '@shopify/react-native-skia';

import type { SelectionDotProps } from '@suite-native/react-native-graph';

const LINE_LENGTH = 3000;
const LINE_WIDTH = 0.5;
const LINE_HIDDEN_WIDTH = 1e-9;
const CIRCLE_RADIUS = 5;

const springAnimationConfig = {
    mass: 0.2,
};

export const SelectionDotWithLine = ({ isActive, color, circleX, circleY }: SelectionDotProps) => {
    const circleRadius = useValue(0);
    const lineWidth = useValue(LINE_HIDDEN_WIDTH);

    const lineStart = useComputedValue(() => vec(circleX.current, 0), [circleX]);
    const lineEnd = useComputedValue(() => vec(circleX.current, LINE_LENGTH), [circleX]);

    const setIsActive = useCallback(
        (active: boolean) => {
            runSpring(circleRadius, active ? CIRCLE_RADIUS : 0, springAnimationConfig);
            runSpring(lineWidth, active ? LINE_WIDTH : LINE_HIDDEN_WIDTH, springAnimationConfig);
        },
        [circleRadius, lineWidth],
    );
    useAnimatedReaction(
        () => isActive.value,
        active => {
            runOnJS(setIsActive)(active);
        },
        [isActive, setIsActive],
    );

    return (
        <Group>
            <Circle cx={circleX} cy={circleY} r={circleRadius} color={color} />
            <Line p1={lineStart} p2={lineEnd} strokeWidth={lineWidth} color={color} />
        </Group>
    );
};
